import { useEffect, useRef } from 'react'
import type { Fixture } from '../fixtures'
import { VimEditorAdapter, type EditorSnapshot } from '../editor/VimEditorAdapter'

export function VimEditor({ fixture, generation, adapterRef, onChange }: { fixture: Fixture; generation: number; adapterRef: React.MutableRefObject<VimEditorAdapter | null>; onChange: (value: EditorSnapshot) => void }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const adapter = new VimEditorAdapter(host.current, fixture)
    adapterRef.current = adapter
    const unsubscribe = adapter.subscribe(onChange)
    adapter.focus()
    return () => { unsubscribe(); adapter.destroy(); if (adapterRef.current === adapter) adapterRef.current = null }
  }, [fixture, generation, adapterRef, onChange])
  return <div className="editor" data-testid="vim-editor" ref={host} />
}
