import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Exercise } from '../content/model'
import { parseInlineMarkup } from '../content/inlineMarkup'
import { diffSnapshots, type SnapshotEffect } from '../demonstration/snapshotDiff'
import { initialPlayerState, reducePlayer } from '../demonstration/playerState'
import type { VimEditorAdapter } from '../editor/VimEditorAdapter'
import { demonstrationTokenLabel } from '../demonstration/display'

const speeds = { slow: 1500, normal: 1100, fast: 700 } as const
type Speed = keyof typeof speeds
function InlineText({ text }: { text: string }) { return <>{parseInlineMarkup(text).map((part, index) => <Fragment key={index}>{part.type === 'code' ? <code>{part.value}</code> : part.value}</Fragment>)}</> }

export function DemonstrationPlayer({ exercise, adapterRef, recreate, onDemonstrated, onExit, onBusyChange }: {
  exercise: Exercise
  adapterRef: React.MutableRefObject<VimEditorAdapter | null>
  recreate: (signal: AbortSignal) => Promise<VimEditorAdapter | null>
  onDemonstrated: () => void
  onExit: () => Promise<void>
  onBusyChange: (busy: boolean) => void
}) {
  const steps = exercise.demonstration.steps
  const [state, dispatch] = useReducer(reducePlayer, undefined, initialPlayerState)
  const [effect, setEffect] = useState<SnapshotEffect | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [speed, setSpeed] = useState<Speed>('normal')
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<number | null>(null)
  const emphasisTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const busy = activeIndex !== null

  const cancel = useCallback(() => {
    abortRef.current?.abort(); abortRef.current = null
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    if (emphasisTimerRef.current !== null) window.clearTimeout(emphasisTimerRef.current)
    emphasisTimerRef.current = null
  }, [])

  const beginOperation = useCallback(() => { cancel(); const controller = new AbortController(); abortRef.current = controller; return controller }, [cancel])
  const isCurrent = useCallback((controller: AbortController) => mountedRef.current && abortRef.current === controller && !controller.signal.aborted, [])
  const waitForFrame = useCallback((signal: AbortSignal) => new Promise<boolean>((resolve) => {
    if (signal.aborted) { resolve(false); return }
    const frame = window.requestAnimationFrame(() => { signal.removeEventListener('abort', abort); resolve(!signal.aborted) })
    const abort = () => { window.cancelAnimationFrame(frame); resolve(false) }
    signal.addEventListener('abort', abort, { once: true })
  }), [])

  useEffect(() => { mountedRef.current = true; const mountedAdapter = adapterRef.current; mountedAdapter?.setPlaybackLocked(true); return () => { mountedRef.current = false; cancel(); mountedAdapter?.setPlaybackLocked(false); mountedAdapter?.emphasize(null); onBusyChange(false) } }, [adapterRef, cancel, onBusyChange])
  useEffect(() => { onBusyChange(busy || state.playing) }, [busy, onBusyChange, state.playing])

  const executeNext = useCallback(async () => {
    if (activeIndex !== null || state.nextIndex >= steps.length) return
    const adapter = adapterRef.current
    if (!adapter) return
    const controller = beginOperation()
    const index = state.nextIndex; const step = steps[index]; setActiveIndex(index); setEffect(null); adapter.emphasize(null); onDemonstrated()
    if (!await waitForFrame(controller.signal) || !isCurrent(controller)) return
    const before = adapter.snapshot()
    await adapter.replay(step.tokens, step.display === 'literal' ? 45 : 0, controller.signal)
    if (!isCurrent(controller)) return
    const derived = diffSnapshots(before, adapter.snapshot()); setEffect(derived); adapter.emphasize(derived)
    emphasisTimerRef.current = window.setTimeout(() => { if (isCurrent(controller)) adapter.emphasize(null); emphasisTimerRef.current = null }, 1600)
    dispatch({ type: 'next', stepCount: steps.length })
    setActiveIndex(null)
  }, [activeIndex, adapterRef, beginOperation, isCurrent, onDemonstrated, state.nextIndex, steps, waitForFrame])

  useEffect(() => {
    if (!state.playing || busy || state.nextIndex >= steps.length) return
    timerRef.current = window.setTimeout(() => { timerRef.current = null; void executeNext() }, speeds[speed])
    return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); timerRef.current = null }
  }, [busy, executeNext, speed, state.nextIndex, state.playing, steps.length])

  const reconstruct = async (nextIndex: number) => {
    const controller = beginOperation(); dispatch({ type: 'pause', stepCount: steps.length }); setActiveIndex(0); setEffect(null)
    const adapter = await recreate(controller.signal)
    if (!adapter || !isCurrent(controller)) return
    adapter.setPlaybackLocked(true)
    for (let index = 0; index < nextIndex; index += 1) {
      await adapter.replay(steps[index].tokens, 0, controller.signal)
      if (!isCurrent(controller)) return
    }
    if (!isCurrent(controller)) return
    dispatch({ type: 'restart', stepCount: steps.length })
    for (let index = 0; index < nextIndex; index += 1) dispatch({ type: 'next', stepCount: steps.length })
    setActiveIndex(null)
  }
  const previous = () => { if (!busy && state.nextIndex > 0) void reconstruct(state.nextIndex - 1) }
  const restart = () => { if (!busy) void reconstruct(0) }
  const togglePlay = () => { cancel(); dispatch({ type: state.playing ? 'pause' : 'play', stepCount: steps.length }) }
  const exit = async () => { cancel(); if (!mountedRef.current) return; dispatch({ type: 'pause', stepCount: steps.length }); await onExit() }
  const completed = state.nextIndex === steps.length

  return <section className="demonstration-panel" aria-labelledby="demonstration-heading" data-testid="demonstration-player">
    <div className="demo-heading"><div><p className="lesson-label">Guided demonstration</p><h2 id="demonstration-heading">Build the command one idea at a time</h2></div><label>Playback speed<select aria-label="Playback speed" value={speed} onChange={(event) => setSpeed(event.target.value as Speed)} disabled={busy}>{speed === 'normal' && null}<option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label></div>
    <ol className="demo-timeline">
      {steps.map((step, index) => { const status = index < state.nextIndex ? 'Completed' : index === activeIndex ? 'Active' : index === state.nextIndex ? 'Upcoming' : 'Later'; return <li key={step.id} className={status.toLowerCase()} data-step-id={step.id}><span className="step-status">{status}</span><span className="step-token">{step.display === 'literal' ? <code>{step.tokens.join('')}</code> : <kbd>{step.tokens.map(demonstrationTokenLabel).join('')}</kbd>}</span><span><strong><InlineText text={step.title} /></strong><small><InlineText text={step.explanation} /></small></span></li> })}
    </ol>
    <div className="demo-effect" role="status" aria-live="polite" aria-atomic="true" data-testid="demo-effect"><strong>What changed</strong><p>{effect?.message ?? (completed ? 'Demonstration complete. Reset and reproduce the edit yourself.' : 'Nothing has run yet. Next executes one teaching step.')}</p></div>
    {completed && <p className="demo-complete"><strong>Demonstration complete.</strong> The editor now matches the reference solution.</p>}
    <div className="demo-controls">
      <button onClick={previous} disabled={busy || state.nextIndex === 0}>Previous step</button>
      <button onClick={() => void executeNext()} disabled={busy || completed}>Next step</button>
      <button onClick={togglePlay} disabled={busy || completed}>{state.playing ? 'Pause' : 'Play'}</button>
      <button onClick={restart} disabled={busy || state.nextIndex === 0}>Restart</button>
      <button className="primary" onClick={() => void exit()} disabled={busy}>Exit demonstration / reset and try it yourself</button>
    </div>
  </section>
}
