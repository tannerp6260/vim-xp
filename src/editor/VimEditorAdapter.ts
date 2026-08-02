import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { Compartment, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state'
import { Decoration, drawSelection, EditorView, highlightActiveLine, keymap, lineNumbers, WidgetType } from '@codemirror/view'
import { Vim, getCM, vim } from '@replit/codemirror-vim'
import { expandReplayToken, normalizeKeyboardEvent } from './trace'
import { resetVimGlobalState } from './vimCompatibility'

export type EditorSnapshot = { document: string; cursor: number; selection: { from: number; to: number }; mode: string; trace: string[] }
export type EditorInitialState = { text: string; cursor: number; selection?: { anchor: number; head: number }; language?: 'cpp' | 'cmake' | 'shell' }

type Emphasis = { from: number; to: number; boundary: boolean } | null
const setEmphasis = StateEffect.define<Emphasis>()
class BoundaryMarker extends WidgetType { toDOM() { const marker = document.createElement('span'); marker.className = 'demo-boundary'; marker.setAttribute('aria-hidden', 'true'); return marker } }
const emphasisField = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    let next = value.map(transaction.changes)
    for (const effect of transaction.effects) if (effect.is(setEmphasis)) {
      const emphasis = effect.value
      next = !emphasis ? Decoration.none : emphasis.boundary ? Decoration.set([Decoration.widget({ widget: new BoundaryMarker(), side: 1 }).range(emphasis.from)]) : Decoration.set([Decoration.mark({ class: 'demo-emphasis' }).range(emphasis.from, emphasis.to)])
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

export class VimEditorAdapter {
  private view: EditorView
  private listeners = new Set<(state: EditorSnapshot) => void>()
  private trace: string[] = []
  private readonly keyListener: (event: KeyboardEvent) => void
  private readonly modeListener = () => this.emit()
  private readonly editable = new Compartment()

  constructor(parent: HTMLElement, initial: EditorInitialState) {
    // The package stores registers, macros, search, and marks outside EditorView.
    // Its typed reset hook is required to make a newly constructed exercise isolated.
    resetVimGlobalState()
    const language: Extension[] = initial.language === 'cpp' ? [cpp()] : []
    this.view = new EditorView({ parent, state: EditorState.create({ doc: initial.text,
      selection: initial.selection ?? { anchor: initial.cursor }, extensions: [vim(), lineNumbers(), drawSelection(), highlightActiveLine(), history(), keymap.of([...defaultKeymap, ...historyKeymap]), this.editable.of(EditorView.editable.of(true)), emphasisField, ...language,
        EditorView.updateListener.of((update) => { if (update.docChanged || update.selectionSet) this.emit() })] }) })
    this.keyListener = (event) => { const token = normalizeKeyboardEvent(event); if (token) { this.trace.push(token); queueMicrotask(() => this.emit()) } }
    this.view.contentDOM.addEventListener('keydown', this.keyListener, true)
    getCM(this.view)?.on('vim-mode-change', this.modeListener)
  }

  focus() { this.view.focus() }
  snapshot(): EditorSnapshot {
    const range = this.view.state.selection.main
    const mode = getCM(this.view)?.state.vim?.mode ?? 'normal'
    return { document: this.view.state.doc.toString(), cursor: range.head, selection: { from: range.from, to: range.to }, mode, trace: [...this.trace] }
  }
  subscribe(listener: (state: EditorSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot()); return () => this.listeners.delete(listener) }
  setPlaybackLocked(locked: boolean) { this.view.dispatch({ effects: this.editable.reconfigure(EditorView.editable.of(!locked)) }); if (locked) this.view.contentDOM.blur() }
  emphasize(effect: { range?: { from: number; to: number }; boundary?: number } | null) {
    const value = effect?.range ? { ...effect.range, boundary: false } : effect?.boundary !== undefined ? { from: Math.min(effect.boundary, this.view.state.doc.length), to: Math.min(effect.boundary, this.view.state.doc.length), boundary: true } : null
    this.view.dispatch({ effects: setEmphasis.of(value) })
  }
  async replay(tokens: string[], stepDelay = 0, signal?: AbortSignal) {
    this.focus()
    const cm = getCM(this.view)
    if (!cm) throw new Error('CodeMirror Vim compatibility adapter is unavailable')
    for (const token of tokens.flatMap(expandReplayToken)) {
      if (signal?.aborted) return
      const handled = Vim.handleKey(cm, token, 'replay')
      if (!handled && cm.state.vim?.insertMode && token.length === 1) cm.replaceSelection(token)
      this.trace.push(token)
      this.emit()
      if (stepDelay) await new Promise((resolve) => setTimeout(resolve, stepDelay))
    }
  }
  destroy() { this.view.contentDOM.removeEventListener('keydown', this.keyListener, true); getCM(this.view)?.off('vim-mode-change', this.modeListener); this.listeners.clear(); this.view.destroy() }
  private emit() { const state = this.snapshot(); this.listeners.forEach((listener) => listener(state)) }
}
