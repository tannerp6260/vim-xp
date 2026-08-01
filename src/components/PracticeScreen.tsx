import { useCallback, useEffect, useRef, useState } from 'react'
import { coachAttempt, type Coaching } from '../content/coaching'
import { evaluateOutcome } from '../content/evaluator'
import { changeInsideQuotesExercise as exercise } from '../content/firstExercise'
import type { EditorSnapshot, VimEditorAdapter } from '../editor/VimEditorAdapter'
import { VimEditor } from './VimEditor'

const initialSnapshot: EditorSnapshot = { document: exercise.initial.document, cursor: exercise.initial.cursor, selection: { from: exercise.initial.cursor, to: exercise.initial.cursor }, mode: 'normal', trace: [] }
const editorInitial = { text: exercise.initial.document, cursor: exercise.initial.cursor, selection: exercise.initial.selection, language: exercise.initial.language }

export function PracticeScreen() {
  const [generation, setGeneration] = useState(0)
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [hintCount, setHintCount] = useState(0)
  const [feedback, setFeedback] = useState<Coaching | null>(null)
  const [complete, setComplete] = useState(false)
  const [demonstrating, setDemonstrating] = useState(false)
  const [demoPending, setDemoPending] = useState(false)
  const adapterRef = useRef<VimEditorAdapter | null>(null)

  const reset = useCallback(() => {
    setSnapshot(initialSnapshot)
    setFeedback(null)
    setComplete(false)
    setDemonstrating(false)
    setDemoPending(false)
    setGeneration((value) => value + 1)
  }, [])

  const check = useCallback(() => {
    if (demonstrating) {
      setFeedback({ kind: 'document', message: 'That was the demonstration. Reset the exercise and make the edit yourself when you’re ready.' })
      return
    }
    const current = adapterRef.current?.snapshot() ?? snapshot
    const result = evaluateOutcome(exercise.outcome, current)
    const coaching = coachAttempt(exercise, result, current.trace)
    setFeedback(coaching)
    setComplete(result.passed)
  }, [demonstrating, snapshot])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); check() }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [check])

  useEffect(() => {
    if (!demoPending) return
    const timer = window.setTimeout(async () => {
      setDemoPending(false)
      setDemonstrating(true)
      await adapterRef.current?.replay(exercise.referenceSolutions[0].tokens, 140)
      setFeedback({ kind: 'success', message: 'Demonstration complete. Reset the exercise, then reproduce the edit yourself.' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [demoPending, generation])

  const demonstrate = () => {
    setSnapshot(initialSnapshot)
    setFeedback(null)
    setComplete(false)
    setDemonstrating(false)
    setGeneration((value) => value + 1)
    setDemoPending(true)
  }

  return <main className="practice-screen">
    <nav className="product-nav" aria-label="Product"><a className="brand" href="#/practice">Vim XP <span>working title</span></a><a className="lab-link" href="#/lab">Engine lab</a></nav>
    <header className="practice-header"><p className="lesson-label">Inner text objects · First exercise</p><h1>{exercise.title}</h1><p className="goal">{exercise.prompt}</p></header>

    <section className="practice-card" aria-labelledby="editor-heading">
      <div className="editor-bar"><h2 id="editor-heading">Build configuration</h2><span className="mode-pill">Mode: <strong data-testid="practice-mode">{snapshot.mode}</strong></span></div>
      <VimEditor initial={editorInitial} generation={generation} adapterRef={adapterRef} onChange={setSnapshot} />
      <div className="practice-actions">
        <button className="secondary" onClick={reset}>Reset</button>
        <button className="secondary" onClick={() => setHintCount((count) => Math.min(count + 1, exercise.hints.length))}>{hintCount ? 'Next hint' : 'Hint'}</button>
        <button className="primary" onClick={check}>Check <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button>
      </div>
    </section>

    {hintCount > 0 && <section className="hint-card" aria-label="Hints"><p className="hint-count">Hint {hintCount} of {exercise.hints.length}</p><p>{exercise.hints[hintCount - 1]}</p>{hintCount === exercise.hints.length && <button className="demo-button" onClick={demonstrate}>Watch stepped demonstration</button>}</section>}

    <section className={`feedback ${feedback?.kind ?? ''}`} aria-live="polite" aria-atomic="true" data-testid="feedback">
      {feedback ? <><strong>{feedback.kind === 'success' ? (complete ? 'Exercise complete' : 'Ready to try') : 'Keep going'}</strong><p>{feedback.message}</p>{complete && <button className="retry" onClick={reset}>Retry exercise</button>}</> : <p>Make the edit, return to Normal mode, then check your work.</p>}
    </section>
  </main>
}
