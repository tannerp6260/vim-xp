import { useEffect, useRef } from 'react'
import { VimEditorAdapter, type EditorInitialState, type EditorSnapshot } from '../editor/VimEditorAdapter'

export function VimEditor({ initial, generation, adapterRef, onChange }: { initial: EditorInitialState; generation: number; adapterRef: React.MutableRefObject<VimEditorAdapter | null>; onChange: (value: EditorSnapshot) => void }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const adapter = new VimEditorAdapter(host.current, initial)
    adapterRef.current = adapter
    const unsubscribe = adapter.subscribe(onChange)
    adapter.focus()
    return () => { unsubscribe(); adapter.destroy(); if (adapterRef.current === adapter) adapterRef.current = null }
  }, [initial, generation, adapterRef, onChange])
  return <div className="editor" data-testid="vim-editor" ref={host} />
}
