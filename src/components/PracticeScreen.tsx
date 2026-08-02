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
import { DemonstrationPlayer } from './DemonstrationPlayer'

function InlineText({ children }: { children: string }) {
  return <>{parseInlineMarkup(children).map((segment, index) => <Fragment key={index}>{segment.type === 'code' ? <code>{segment.value}</code> : segment.value}</Fragment>)}</>
}
const getExercise = (id: string) => { const exercise = curriculum.exercises.find((item) => item.id === id); if (!exercise) throw new Error(`Unknown exercise ${id}`); return exercise }
const initialSnapshot = (exercise: Exercise): EditorSnapshot => ({ document: exercise.initial.document, cursor: exercise.initial.cursor, selection: { from: exercise.initial.cursor, to: exercise.initial.cursor }, mode: 'normal', trace: [] })

export function PracticeScreen() {
  const [renderNow] = useState(() => Date.now())
  const store = useMemo(() => createProgressStore(typeof localStorage === 'undefined' ? undefined : localStorage, curriculum.version, curriculum.exercises.map((item) => item.id)), [])
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
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [demonstrated, setDemonstrated] = useState(false)
  const adapterRef = useRef<VimEditorAdapter | null>(null)
  const editorInitial = useMemo(() => ({ text: exercise.initial.document, cursor: exercise.initial.cursor, selection: exercise.initial.selection, language: exercise.initial.language }), [exercise])
  useEffect(() => store.save(progress), [progress, store])

  const reset = useCallback(() => { setDemoOpen(false); setDemoBusy(false); setSnapshot(initialSnapshot(exercise)); setFeedback(null); setComplete(false); setGeneration((value) => value + 1) }, [exercise])
  const check = useCallback(() => {
    if (demoOpen) return
    const current = adapterRef.current?.snapshot() ?? snapshot
    const result = evaluateOutcome(exercise.outcome, current)
    setFeedback(coachAttempt(exercise, result, current.trace)); setComplete(result.passed)
    if (!result.passed) setIncorrectChecks((count) => count + 1)
  }, [demoOpen, exercise, snapshot])

  const advance = (skipped: boolean) => {
    if (demoOpen) return
    const now = Date.now(); const evidence = { sessionId: session.id, exerciseId: exercise.id, conceptIds: exercise.primaryConcepts, correct: !skipped, incorrectChecks, hintLevel: hintCount, demonstrated, skipped, completedAt: now }
    const learner = updateLearner(progress.learner, evidence, exercise.variantGroupId)
    const nextIndex = session.index + 1; const finished = nextIndex >= session.exerciseIds.length
    setProgress({ ...progress, learner, recentVariants: [...progress.recentVariants, exercise.variantGroupId].slice(-20), session: { ...session, index: finished ? session.index : nextIndex, completed: finished } })
    setDemoOpen(false); setDemoBusy(false); setHintCount(0); setFeedback(null); setComplete(false); setIncorrectChecks(0); setDemonstrated(false); setSnapshot(initialSnapshot(finished ? exercise : getExercise(session.exerciseIds[nextIndex]))); setGeneration((value) => value + 1)
  }
  const demonstrate = () => { setSnapshot(initialSnapshot(exercise)); setFeedback(null); setComplete(false); setGeneration((value) => value + 1); setDemoOpen(true) }
  const waitForAdapter = async () => { await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))); if (!adapterRef.current) throw new Error('Editor did not recreate for demonstration'); return adapterRef.current }
  const recreateDemo = async () => { setSnapshot(initialSnapshot(exercise)); setGeneration((value) => value + 1); return waitForAdapter() }
  const exitDemo = async () => { setDemoOpen(false); setDemoBusy(false); setFeedback(null); setComplete(false); setSnapshot(initialSnapshot(exercise)); setGeneration((value) => value + 1); await waitForAdapter() }
  const clearTransient = (nextExercise: Exercise) => { setDemoOpen(false); setDemoBusy(false); setHintCount(0); setFeedback(null); setComplete(false); setIncorrectChecks(0); setDemonstrated(false); setSnapshot(initialSnapshot(nextExercise)); setGeneration((value) => value + 1) }
  const anotherSession = () => { const next = planSession(curriculum, progress.learner, { now: Date.now }, (Date.now() + progress.learner.attempts.length) >>> 0, false, progress.recentVariants); setProgress({ ...progress, session: { ...next, index: 0, completed: false } }); clearTransient(getExercise(next.exerciseIds[0])) }
  const resetProgress = () => { if (!window.confirm('Reset all local Vim XP progress? This cannot be undone.')) return; store.reset(); const fresh = freshProgress(curriculum.version); const next = planSession(curriculum, fresh.learner, { now: Date.now }, Date.now() >>> 0, true); setProgress({ ...fresh, session: { ...next, index: 0, completed: false } }); clearTransient(getExercise(next.exerciseIds[0])) }
  useEffect(() => { const listener = (event: KeyboardEvent) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); if (demoOpen) return; if (complete) advance(false); else check() } }; window.addEventListener('keydown', listener, true); return () => window.removeEventListener('keydown', listener, true) })

  if (session.completed) {
    const concepts = [...new Set(session.exerciseIds.flatMap((id) => getExercise(id).primaryConcepts))]
    const attempts = progress.learner.attempts.filter((attempt) => attempt.sessionId === session.id); const skipped = attempts.filter((attempt) => attempt.skipped).length; const completed = attempts.filter((attempt) => attempt.correct && !attempt.skipped).length; const allCompleted = completed === session.exerciseIds.length
    return <main className="practice-screen completion-screen"><ProductNav onReset={resetProgress} busy={false} /><section className="completion-card"><p className="lesson-label">Session complete</p><h1>{allCompleted ? 'Seven precise edits, done.' : 'Session complete'}</h1><p data-testid="session-summary">{allCompleted ? 'You completed every exercise.' : `${completed} completed · ${skipped} skipped`}</p>{completed > 0 && <p>You practiced targeting quoted values, words, and content inside parentheses across C++, CMake, and shell.</p>}<ul>{concepts.map((id) => { const concept = curriculum.concepts.find((item) => item.id === id)!; return <li key={id}><strong>{concept.title}</strong><span>{learnerLabel(progress.learner.concepts[id], renderNow)}</span></li> })}</ul><button className="primary" onClick={anotherSession}>Practice another session</button></section></main>
  }

  const stateLabel = learnerLabel(progress.learner.concepts[exercise.primaryConcepts[0]], renderNow)
  const busy = demoOpen || demoBusy
  return <main className="practice-screen"><ProductNav onReset={resetProgress} busy={busy} />
    <div className="session-progress"><div><span>Practice session</span><strong>{session.index + 1} of {session.exerciseIds.length}</strong></div><div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={session.exerciseIds.length} aria-valuenow={session.index + 1}><span style={{ width: `${((session.index + 1) / session.exerciseIds.length) * 100}%` }} /></div></div>
    <header className="practice-header"><p className="lesson-label">{exercise.role} · {stateLabel}</p><h1>{exercise.title}</h1><p className="goal"><InlineText>{exercise.prompt}</InlineText></p></header>
    <section className="practice-card" aria-labelledby="editor-heading"><div className="editor-bar"><h2 id="editor-heading">{exercise.initial.language} editing task</h2><span className="mode-pill">Mode: <strong data-testid="practice-mode">{snapshot.mode}</strong></span></div><VimEditor initial={editorInitial} generation={generation} adapterRef={adapterRef} onChange={setSnapshot} /><div className="practice-actions"><button className="secondary" onClick={reset} disabled={busy}>Reset exercise</button><button className="secondary" disabled={busy} onClick={() => setHintCount((count) => Math.min(count + 1, 4))}>{hintCount ? 'Next hint' : 'Hint'}</button><button className="skip" disabled={busy} onClick={() => advance(true)}>Skip for now</button><button className="primary" disabled={busy} onClick={complete ? () => advance(false) : check}>{complete ? 'Continue' : <>Check <kbd>Ctrl</kbd>+<kbd>Enter</kbd></>}</button></div></section>
    {hintCount > 0 && <section className="hint-card" aria-label="Hints"><p className="hint-count">Hint {hintCount} of 4</p><p><InlineText>{exercise.hints[hintCount - 1]}</InlineText></p>{hintCount === 4 && <button className="demo-button" onClick={demonstrate}>Watch stepped demonstration</button>}</section>}
    {demoOpen && <DemonstrationPlayer exercise={exercise} adapterRef={adapterRef} recreate={recreateDemo} onDemonstrated={() => setDemonstrated(true)} onExit={exitDemo} onBusyChange={setDemoBusy} />}
    <section className={`feedback ${feedback?.kind ?? ''}`} aria-live="polite" aria-atomic="true" data-testid="feedback">{feedback ? <><strong>{feedback.kind === 'success' ? (complete ? 'Exercise complete' : 'Ready to try') : 'Keep going'}</strong><p><InlineText>{feedback.message}</InlineText></p>{complete && <div className="feedback-actions"><button className="retry" onClick={reset}>Retry exercise</button><button className="primary" onClick={() => advance(false)}>Continue</button></div>}</> : <p>Make the edit, return to Normal mode, then check your work.</p>}</section>
  </main>
}

function ProductNav({ onReset, busy }: { onReset: () => void; busy: boolean }) { return <nav className="product-nav" aria-label="Product"><a className="brand" href="#/practice">Vim XP <span>working title</span></a><div><button className="reset-progress" onClick={onReset}>Reset local progress</button><a className={`lab-link ${busy ? 'disabled' : ''}`} aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault() }} href="#/lab">Engine lab</a></div></nav> }
