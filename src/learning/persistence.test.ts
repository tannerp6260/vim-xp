import { describe, expect, it } from 'vitest'
import { createProgressStore, freshProgress, migrateProgress, STORAGE_KEY } from './persistence'

class MemoryStorage { value: string | null = null; getItem(key?: string) { void key; return this.value } setItem(_key: string, value: string) { this.value = value } removeItem(key?: string) { void key; this.value = null } }
describe('progress persistence', () => {
  it('loads, saves, resets, and bounds attempt history', () => {
    const storage = new MemoryStorage(); const store = createProgressStore(storage, '2.0.0'); const progress = freshProgress('2.0.0')
    progress.learner.attempts = Array.from({ length: 120 }, (_, index) => ({ exerciseId: 'exercise.change-inside-quotes' as const, conceptIds: ['concept.inner-quotes' as const], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: index }))
    store.save(progress); expect(store.load().learner.attempts).toHaveLength(100); store.reset(); expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('handles malformed and unavailable storage', () => { const storage = new MemoryStorage(); storage.value = '{bad'; expect(createProgressStore(storage, '2.0.0').load().learner.attempts).toEqual([]); expect(createProgressStore(undefined, '2.0.0').load().schemaVersion).toBe(1) })
  it('uses an explicit migration boundary', () => expect(migrateProgress({ schemaVersion: 0 }, '2.0.0').curriculumVersion).toBe('2.0.0'))
  it('survives throwing storage', () => { const broken = { getItem: () => { throw new Error() }, setItem: () => { throw new Error() }, removeItem: () => { throw new Error() } }; expect(createProgressStore(broken, '2.0.0').load().learner.attempts).toEqual([]) })
})
