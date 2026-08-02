import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { coachAttempt, type Coaching } from '../content/coaching'
import { evaluateOutcome } from '../content/evaluator'
import { curriculum } from '../content/firstExercise'
import { parseInlineMarkup } from '../content/inlineMarkup'
import type { Exercise } from '../content/model'
import type { EditorSnapshot, VimEditorAdapter } from '../editor/VimEditorAdapter'
import { learnerLabel, updateLearner } from '../learning/learnerModel'
import { createProgressStore, freshProgress, type StoredProgress } from '../learning/persistence'
import { planSession } from '../learning/planner'
import { VimEditor } from './VimEditor'

function InlineText({ children }: { children: string }) {
  return <>{parseInlineMarkup(children).map((segment, index) => <Fragment key={index}>{segment.type === 'code' ? <code>{segment.value}</code> : segment.value}</Fragment>)}</>
}
const getExercise = (id: string) => curriculum.exercises.find((exercise) => exercise.id === id) ?? curriculum.exercises[0]
const initialSnapshot = (exercise: Exercise): EditorSnapshot => ({ document: exercise.initial.document, cursor: exercise.initial.cursor, selection: { from: exercise.initial.cursor, to: exercise.initial.cursor }, mode: 'normal', trace: [] })

export function PracticeScreen() {
  const [renderNow] = useState(() => Date.now())
  const store = useMemo(() => createProgressStore(typeof localStorage === 'undefined' ? undefined : localStorage, curriculum.version), [])
  const [progress, setProgress] = useState<StoredProgress>(() => {
    const loaded = store.load()
    if (loaded.session && !loaded.session.completed) return loaded
    const session = planSession(curriculum, loaded.learner, { now: Date.now }, Date.now() >>> 0, loaded.learner.attempts.length === 0)
    return { ...loaded, session: { ...session, index: 0, completed: false } }
  })
  const session = progress.session!
  const exercise = getExercise(session.exerciseIds[session.index] ?? session.exerciseIds[0])
  const [generation, setGeneration] = useState(0)
  const [snapshot, setSnapshot] = useState(() => initialSnapshot(exercise))
  const [hintCount, setHintCount] = useState(0)
  const [feedback, setFeedback] = useState<Coaching | null>(null)
  const [complete, setComplete] = useState(false)
  const [incorrectChecks, setIncorrectChecks] = useState(0)
  const [demonstrating, setDemonstrating] = useState(false)
  const [demonstrated, setDemonstrated] = useState(false)
  const [demoPending, setDemoPending] = useState(false)
  const adapterRef = useRef<VimEditorAdapter | null>(null)
  const editorInitial = useMemo(() => ({ text: exercise.initial.document, cursor: exercise.initial.cursor, selection: exercise.initial.selection, language: exercise.initial.language }), [exercise])
  useEffect(() => store.save(progress), [progress, store])

  const reset = useCallback(() => { setSnapshot(initialSnapshot(exercise)); setFeedback(null); setComplete(false); setDemonstrating(false); setDemoPending(false); setGeneration((value) => value + 1) }, [exercise])
  const check = useCallback(() => {
    if (demonstrating) { setFeedback({ kind: 'document', message: 'That was the demonstration. Reset and reproduce the edit when you’re ready.' }); return }
    const current = adapterRef.current?.snapshot() ?? snapshot
    const result = evaluateOutcome(exercise.outcome, current)
    setFeedback(coachAttempt(exercise, result, current.trace)); setComplete(result.passed)
    if (!result.passed) setIncorrectChecks((count) => count + 1)
  }, [demonstrating, exercise, snapshot])
  useEffect(() => { const listener = (event: KeyboardEvent) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); check() } }; window.addEventListener('keydown', listener, true); return () => window.removeEventListener('keydown', listener, true) }, [check])
  useEffect(() => { if (!demoPending) return; const timer = window.setTimeout(async () => { setDemoPending(false); setDemonstrating(true); setDemonstrated(true); await adapterRef.current?.replay(exercise.referenceSolutions[0].tokens, 90); setFeedback({ kind: 'success', message: 'Demonstration complete. Reset, then reproduce the edit yourself.' }) }, 0); return () => window.clearTimeout(timer) }, [demoPending, exercise, generation])

  const advance = (skipped: boolean) => {
    const now = Date.now(); const evidence = { exerciseId: exercise.id, conceptIds: exercise.primaryConcepts, correct: !skipped, incorrectChecks, hintLevel: hintCount, demonstrated, skipped, completedAt: now }
    const learner = updateLearner(progress.learner, evidence, exercise.variantGroupId)
    const nextIndex = session.index + 1; const finished = nextIndex >= session.exerciseIds.length
    setProgress({ ...progress, learner, recentVariants: [...progress.recentVariants, exercise.variantGroupId].slice(-20), session: { ...session, index: finished ? session.index : nextIndex, completed: finished } })
    setHintCount(0); setFeedback(null); setComplete(false); setIncorrectChecks(0); setDemonstrated(false); setDemonstrating(false); setSnapshot(initialSnapshot(finished ? exercise : getExercise(session.exerciseIds[nextIndex]))); setGeneration((value) => value + 1)
  }
  const demonstrate = () => { reset(); setDemoPending(true) }
  const anotherSession = () => { const next = planSession(curriculum, progress.learner, { now: Date.now }, (Date.now() + progress.learner.attempts.length) >>> 0, false); setProgress({ ...progress, session: { ...next, index: 0, completed: false } }); setSnapshot(initialSnapshot(getExercise(next.exerciseIds[0]))); setHintCount(0); setFeedback(null); setComplete(false); setGeneration((value) => value + 1) }
  const resetProgress = () => { if (!window.confirm('Reset all local Vim XP progress? This cannot be undone.')) return; store.reset(); const fresh = freshProgress(curriculum.version); const next = planSession(curriculum, fresh.learner, { now: Date.now }, Date.now() >>> 0, true); setProgress({ ...fresh, session: { ...next, index: 0, completed: false } }); setSnapshot(initialSnapshot(getExercise(next.exerciseIds[0]))); setGeneration((value) => value + 1) }

  if (session.completed) {
    const concepts = [...new Set(session.exerciseIds.flatMap((id) => getExercise(id).primaryConcepts))]
    return <main className="practice-screen completion-screen"><ProductNav onReset={resetProgress} /><section className="completion-card"><p className="lesson-label">Session complete</p><h1>Seven precise edits, done.</h1><p>You practiced targeting quoted values, words, and content inside parentheses across C++, CMake, and shell.</p><ul>{concepts.map((id) => { const concept = curriculum.concepts.find((item) => item.id === id)!; return <li key={id}><strong>{concept.title}</strong><span>{learnerLabel(progress.learner.concepts[id], renderNow)}</span></li> })}</ul><button className="primary" onClick={anotherSession}>Practice another session</button></section></main>
  }

  const stateLabel = learnerLabel(progress.learner.concepts[exercise.primaryConcepts[0]], renderNow)
  return <main className="practice-screen"><ProductNav onReset={resetProgress} />
    <div className="session-progress"><div><span>Practice session</span><strong>{session.index + 1} of {session.exerciseIds.length}</strong></div><div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={session.exerciseIds.length} aria-valuenow={session.index + 1}><span style={{ width: `${((session.index + 1) / session.exerciseIds.length) * 100}%` }} /></div></div>
    <header className="practice-header"><p className="lesson-label">{exercise.role} · {stateLabel}</p><h1>{exercise.title}</h1><p className="goal"><InlineText>{exercise.prompt}</InlineText></p></header>
    <section className="practice-card" aria-labelledby="editor-heading"><div className="editor-bar"><h2 id="editor-heading">{exercise.initial.language} editing task</h2><span className="mode-pill">Mode: <strong data-testid="practice-mode">{snapshot.mode}</strong></span></div><VimEditor initial={editorInitial} generation={generation} adapterRef={adapterRef} onChange={setSnapshot} /><div className="practice-actions"><button className="secondary" onClick={reset}>Reset exercise</button><button className="secondary" onClick={() => setHintCount((count) => Math.min(count + 1, 4))}>{hintCount ? 'Next hint' : 'Hint'}</button><button className="skip" onClick={() => advance(true)}>Skip for now</button><button className="primary" onClick={check}>Check <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button></div></section>
    {hintCount > 0 && <section className="hint-card" aria-label="Hints"><p className="hint-count">Hint {hintCount} of 4</p><p><InlineText>{exercise.hints[hintCount - 1]}</InlineText></p>{hintCount === 4 && <button className="demo-button" onClick={demonstrate}>Watch stepped demonstration</button>}</section>}
    <section className={`feedback ${feedback?.kind ?? ''}`} aria-live="polite" aria-atomic="true" data-testid="feedback">{feedback ? <><strong>{feedback.kind === 'success' ? (complete ? 'Exercise complete' : 'Ready to try') : 'Keep going'}</strong><p><InlineText>{feedback.message}</InlineText></p>{complete && <div className="feedback-actions"><button className="retry" onClick={reset}>Retry exercise</button><button className="primary" onClick={() => advance(false)}>Continue</button></div>}</> : <p>Make the edit, return to Normal mode, then check your work.</p>}</section>
  </main>
}

function ProductNav({ onReset }: { onReset: () => void }) { return <nav className="product-nav" aria-label="Product"><a className="brand" href="#/practice">Vim XP <span>working title</span></a><div><button className="reset-progress" onClick={onReset}>Reset local progress</button><a className="lab-link" href="#/lab">Engine lab</a></div></nav> }
