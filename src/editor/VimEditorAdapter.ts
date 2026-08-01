import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { EditorState, type Extension } from '@codemirror/state'
import { drawSelection, EditorView, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view'
import { Vim, getCM, vim } from '@replit/codemirror-vim'
import { expandReplayToken, normalizeKeyboardEvent } from './trace'
import { resetVimGlobalState } from './vimCompatibility'

export type EditorSnapshot = { document: string; cursor: number; selection: { from: number; to: number }; mode: string; trace: string[] }
export type EditorInitialState = { text: string; cursor: number; selection?: { anchor: number; head: number }; language?: 'cpp' | 'cmake' | 'shell' }

export class VimEditorAdapter {
  private view: EditorView
  private listeners = new Set<(state: EditorSnapshot) => void>()
  private trace: string[] = []
  private readonly keyListener: (event: KeyboardEvent) => void

  constructor(parent: HTMLElement, initial: EditorInitialState) {
    // The package stores registers, macros, search, and marks outside EditorView.
    // Its typed reset hook is required to make a newly constructed exercise isolated.
    resetVimGlobalState()
    const language: Extension[] = initial.language === 'cpp' ? [cpp()] : []
    this.view = new EditorView({ parent, state: EditorState.create({ doc: initial.text,
      selection: initial.selection ?? { anchor: initial.cursor }, extensions: [vim(), lineNumbers(), drawSelection(), highlightActiveLine(), history(), keymap.of([...defaultKeymap, ...historyKeymap]), ...language,
        EditorView.updateListener.of((update) => { if (update.docChanged || update.selectionSet) this.emit() })] }) })
    this.keyListener = (event) => { const token = normalizeKeyboardEvent(event); if (token) { this.trace.push(token); queueMicrotask(() => this.emit()) } }
    this.view.contentDOM.addEventListener('keydown', this.keyListener, true)
  }

  focus() { this.view.focus() }
  snapshot(): EditorSnapshot {
    const range = this.view.state.selection.main
    const mode = getCM(this.view)?.state.vim?.mode ?? 'normal'
    return { document: this.view.state.doc.toString(), cursor: range.head, selection: { from: range.from, to: range.to }, mode, trace: [...this.trace] }
  }
  subscribe(listener: (state: EditorSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot()); return () => this.listeners.delete(listener) }
  async replay(tokens: string[], stepDelay = 0) {
    this.focus()
    const cm = getCM(this.view)
    if (!cm) throw new Error('CodeMirror Vim compatibility adapter is unavailable')
    for (const token of tokens.flatMap(expandReplayToken)) {
      Vim.handleKey(cm, token, 'replay')
      this.trace.push(token)
      this.emit()
      if (stepDelay) await new Promise((resolve) => setTimeout(resolve, stepDelay))
    }
  }
  destroy() { this.view.contentDOM.removeEventListener('keydown', this.keyListener, true); this.listeners.clear(); this.view.destroy() }
  private emit() { const state = this.snapshot(); this.listeners.forEach((listener) => listener(state)) }
}
