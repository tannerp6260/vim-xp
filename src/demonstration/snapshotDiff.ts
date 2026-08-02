import type { EditorSnapshot } from '../editor/VimEditorAdapter'

export type SnapshotEffect = {
  kind: 'none' | 'inserted' | 'removed' | 'replaced' | 'mode' | 'cursor'
  message: string
  range?: { from: number; to: number }
  boundary?: number
  modeChange?: { from: string; to: string }
}

const modeName = (mode: string) => mode.charAt(0).toUpperCase() + mode.slice(1)

export function diffSnapshots(before: EditorSnapshot, after: EditorSnapshot): SnapshotEffect {
  const modeChange = before.mode === after.mode ? undefined : { from: before.mode, to: after.mode }
  if (before.document !== after.document) {
    let prefix = 0
    while (prefix < before.document.length && prefix < after.document.length && before.document[prefix] === after.document[prefix]) prefix += 1
    let suffix = 0
    while (suffix < before.document.length - prefix && suffix < after.document.length - prefix && before.document[before.document.length - 1 - suffix] === after.document[after.document.length - 1 - suffix]) suffix += 1
    const removed = before.document.slice(prefix, before.document.length - suffix)
    const inserted = after.document.slice(prefix, after.document.length - suffix)
    const mode = modeChange ? ` Mode changed from ${modeName(modeChange.from)} to ${modeName(modeChange.to)}.` : ''
    if (removed && inserted) return { kind: 'replaced', message: `Replaced “${removed}” with “${inserted}”.${mode}`, range: { from: prefix, to: prefix + inserted.length }, modeChange }
    if (removed) return { kind: 'removed', message: `Removed “${removed}”.${mode}`, boundary: prefix, modeChange }
    return { kind: 'inserted', message: `Inserted “${inserted}”.${mode}`, range: { from: prefix, to: prefix + inserted.length }, modeChange }
  }
  if (modeChange) return { kind: 'mode', message: `Mode changed from ${modeName(modeChange.from)} to ${modeName(modeChange.to)}.`, modeChange }
  if (before.cursor !== after.cursor || before.selection.from !== after.selection.from || before.selection.to !== after.selection.to) return { kind: 'cursor', message: 'The cursor or selection moved; the document did not change.' }
  return { kind: 'none', message: 'No document change yet.' }
}
