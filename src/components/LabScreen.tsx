import { useCallback, useRef, useState } from 'react'
import { VimEditor } from './VimEditor'
import type { EditorSnapshot, VimEditorAdapter } from '../editor/VimEditorAdapter'
import { fixtures, sequences } from '../fixtures'

const empty: EditorSnapshot = { document: '', cursor: 0, selection: { from: 0, to: 0 }, mode: 'normal', trace: [] }

export function LabScreen() {
  const [fixtureId, setFixtureId] = useState(fixtures[0].id)
  const [generation, setGeneration] = useState(0)
  const [snapshot, setSnapshot] = useState(empty)
  const [sequenceId, setSequenceId] = useState(sequences[0].id)
  const [manual, setManual] = useState<Record<string, boolean>>({})
  const adapterRef = useRef<VimEditorAdapter | null>(null)
  const fixture = fixtures.find((item) => item.id === fixtureId) ?? fixtures[0]
  const sequence = sequences.find((item) => item.id === sequenceId) ?? sequences[0]
  const reset = useCallback(() => { setSnapshot(empty); setGeneration((value) => value + 1) }, [])
  const changeFixture = (id: string) => { setFixtureId(id); setSnapshot(empty); setGeneration((value) => value + 1) }

  return <main className="lab-screen">
    <header><p className="eyebrow">Engine experiment · not the product UI</p><h1>CodeMirror Vim feasibility laboratory</h1><p>Probe Vim behavior, observability, replay, and clean exercise isolation before curriculum work begins.</p></header>
    <section className="toolbar" aria-label="Lab controls">
      <label>Fixture<select value={fixtureId} onChange={(event) => changeFixture(event.target.value)}>{fixtures.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <button onClick={reset}>Reset editor and Vim state</button>
      <button onClick={() => adapterRef.current?.focus()}>Focus editor</button>
    </section>
    <div className="workspace">
      <section className="panel editor-panel"><h2>Editor</h2><VimEditor initial={fixture} generation={generation} adapterRef={adapterRef} onChange={setSnapshot} /></section>
      <aside className="panel state-panel"><h2>Observed state</h2><dl><dt>Mode</dt><dd data-testid="mode">{snapshot.mode}</dd><dt>Cursor offset</dt><dd data-testid="cursor">{snapshot.cursor}</dd><dt>Selection</dt><dd>{snapshot.selection.from}–{snapshot.selection.to}</dd><dt>Document length</dt><dd>{snapshot.document.length}</dd></dl><h3>Normalized input trace</h3><output data-testid="trace">{snapshot.trace.join(' ') || 'No input yet'}</output></aside>
    </div>
    <section className="panel replay"><h2>Reference-sequence probe</h2><label>Sequence<select value={sequenceId} onChange={(event) => setSequenceId(event.target.value)}>{sequences.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><p>{sequence.description}</p><code>{sequence.tokens.join(' ')}</code><div className="buttons"><button onClick={() => void adapterRef.current?.replay(sequence.tokens)}>Run</button><button onClick={() => void adapterRef.current?.replay(sequence.tokens, 350)}>Step through</button></div></section>
    <section className="panel"><h2>Manual browser checks</h2><p>These local observations are intentionally not recorded as automated passes.</p>{['Chrome shortcuts do not steal essential Vim input', 'Firefox shortcuts do not steal essential Vim input', 'IME and keyboard layout feel acceptable', 'Narrow desktop layout remains usable'].map((label) => <label className="check" key={label}><input type="checkbox" checked={manual[label] ?? false} onChange={(event) => setManual({ ...manual, [label]: event.target.checked })} />{label}</label>)}</section>
  </main>
}
