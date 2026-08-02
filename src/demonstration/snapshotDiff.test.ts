import { describe, expect, it } from 'vitest'
import { diffSnapshots } from './snapshotDiff'
const snapshot = (document: string, mode = 'normal', cursor = 0) => ({ document, mode, cursor, selection: { from: cursor, to: cursor }, trace: [] })

describe('demonstration snapshot differences', () => {
  it('reports no change', () => expect(diffSnapshots(snapshot('same'), snapshot('same'))).toMatchObject({ kind: 'none', message: 'No document change yet.' }))
  it('derives insertion and its range', () => expect(diffSnapshots(snapshot('ab'), snapshot('aNEWb'))).toMatchObject({ kind: 'inserted', message: 'Inserted “NEW”.', range: { from: 1, to: 4 } }))
  it('derives deletion and its surviving boundary', () => expect(diffSnapshots(snapshot('aOLDb'), snapshot('ab'))).toMatchObject({ kind: 'removed', message: 'Removed “OLD”.', boundary: 1 }))
  it('derives replacement', () => expect(diffSnapshots(snapshot('aOLDb'), snapshot('aNEWb'))).toMatchObject({ kind: 'replaced', message: 'Replaced “OLD” with “NEW”.', range: { from: 1, to: 4 } }))
  it('derives mode-only changes', () => expect(diffSnapshots(snapshot('same'), snapshot('same', 'insert'))).toMatchObject({ kind: 'mode', message: 'Mode changed from Normal to Insert.' }))
  it('reports a useful cursor destination and range', () => expect(diffSnapshots(snapshot('first\nabc', 'normal', 0), snapshot('first\nabc', 'normal', 7))).toMatchObject({ kind: 'cursor', message: 'Cursor moved forward to line 2, column 2, on “b”; the document did not change.', range: { from: 7, to: 8 } }))
})
