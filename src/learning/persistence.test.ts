import { describe, expect, it } from 'vitest'
import { createProgressStore, freshProgress, migrateProgress, STORAGE_KEY, STORAGE_SCHEMA_VERSION } from './persistence'

const ids = ['exercise.change-inside-quotes'] as const
class MemoryStorage { value: string | null = null; getItem(key?: string) { void key; return this.value } setItem(_key: string, value: string) { this.value = value } removeItem(key?: string) { void key; this.value = null } }
const session = { id: 'session-1', exerciseIds: [...ids], prescribed: true, createdAt: 1, seed: 1, index: 0, completed: false }
describe('progress persistence', () => {
  it('loads, saves, resets, and bounds valid attempt history', () => {
    const storage = new MemoryStorage(); const store = createProgressStore(storage, '2.0.0', [...ids]); const progress = freshProgress('2.0.0')
    progress.session = session; progress.learner.attempts = Array.from({ length: 120 }, (_, index) => ({ sessionId: 'session-1', exerciseId: ids[0], conceptIds: ['concept.inner-quotes' as const], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: index }))
    store.save(progress); expect(store.load().learner.attempts).toHaveLength(100); store.reset(); expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('resets data from a different curriculum version', () => { const storage = new MemoryStorage(); storage.value = JSON.stringify({ ...freshProgress('old'), session }); expect(createProgressStore(storage, '2.0.0', [...ids]).load()).toEqual(freshProgress('2.0.0')) })
  it.each([
    ['unknown exercise', { ...session, exerciseIds: ['exercise.missing'] }],
    ['negative index', { ...session, index: -1 }],
    ['out-of-range index', { ...session, index: 1 }],
  ])('rejects an invalid stored session: %s', (_label, invalid) => { const storage = new MemoryStorage(); storage.value = JSON.stringify({ ...freshProgress('2.0.0'), session: invalid }); expect(createProgressStore(storage, '2.0.0', [...ids]).load().session).toBeUndefined() })
  it('handles malformed and unavailable storage', () => { const storage = new MemoryStorage(); storage.value = '{bad'; expect(createProgressStore(storage, '2.0.0', [...ids]).load().learner.attempts).toEqual([]); expect(createProgressStore(undefined, '2.0.0', [...ids]).load().schemaVersion).toBe(STORAGE_SCHEMA_VERSION) })
  it('uses an explicit reset migration boundary', () => expect(migrateProgress({ schemaVersion: 1 }, '2.0.0')).toEqual(freshProgress('2.0.0')))
  it('survives throwing storage', () => { const broken = { getItem: () => { throw new Error() }, setItem: () => { throw new Error() }, removeItem: () => { throw new Error() } }; expect(createProgressStore(broken, '2.0.0', [...ids]).load().learner.attempts).toEqual([]) })
})
