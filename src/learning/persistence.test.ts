import { describe, expect, it } from 'vitest'
import { createProgressStore, freshProgress, migrateProgress, STORAGE_KEY, STORAGE_SCHEMA_VERSION } from './persistence'

const ids = ['exercise.change-inside-quotes'] as const
const units = ['unit.precise-text-objects'] as const
class MemoryStorage { value: string | null = null; getItem(key?: string) { void key; return this.value } setItem(_key: string, value: string) { this.value = value } removeItem(key?: string) { void key; this.value = null } }
const session = { id: 'session-1', exerciseIds: [...ids], prescribed: true, createdAt: 1, seed: 1, index: 0, completed: false, unitId: units[0] }
describe('progress persistence', () => {
  it('loads, saves, resets, and bounds valid attempt history', () => {
    const storage = new MemoryStorage(); const store = createProgressStore(storage, '3.0.0', [...ids], [...units]); const progress = freshProgress('3.0.0')
    progress.session = session; progress.learner.attempts = Array.from({ length: 120 }, (_, index) => ({ sessionId: 'session-1', exerciseId: ids[0], conceptIds: ['concept.inner-quotes' as const], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: index }))
    store.save(progress); expect(store.load().learner.attempts).toHaveLength(100); store.reset(); expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('resets data from an unknown curriculum version', () => { const storage = new MemoryStorage(); storage.value = JSON.stringify({ ...freshProgress('old'), session }); expect(createProgressStore(storage, '3.0.0', [...ids], [...units]).load()).toEqual(freshProgress('3.0.0')) })
  it.each([
    ['unknown exercise', { ...session, exerciseIds: ['exercise.missing'] }],
    ['negative index', { ...session, index: -1 }],
    ['out-of-range index', { ...session, index: 1 }],
  ])('rejects an invalid stored session: %s', (_label, invalid) => { const storage = new MemoryStorage(); storage.value = JSON.stringify({ ...freshProgress('3.0.0'), session: invalid }); expect(createProgressStore(storage, '3.0.0', [...ids], [...units]).load().session).toBeUndefined() })
  it('handles malformed and unavailable storage', () => { const storage = new MemoryStorage(); storage.value = '{bad'; expect(createProgressStore(storage, '3.0.0', [...ids], [...units]).load().learner.attempts).toEqual([]); expect(createProgressStore(undefined, '3.0.0', [...ids], [...units]).load().schemaVersion).toBe(STORAGE_SCHEMA_VERSION) })
  it('migrates schema 2 without losing evidence, history, or session position', () => {
    const oldSession = { ...session }; delete (oldSession as Partial<typeof session>).unitId
    const attempt = { sessionId: 'session-1', exerciseId: ids[0], conceptIds: ['concept.inner-quotes' as const], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 77 }
    const legacy = { schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: { 'concept.inner-quotes': { strength: .4, confidence: .3, successes: 2, exposures: 3, variants: ['quotes-a'], lastSeenAt: 77, dueAt: 88, recentExerciseIds: [ids[0]] } }, attempts: [attempt] }, session: oldSession, recentVariants: ['quotes-a'] }
    const migrated = migrateProgress(legacy, '3.0.0', [...ids], [...units]); expect(migrated).toMatchObject({ schemaVersion: 3, curriculumVersion: '3.0.0', session: { id: 'session-1', index: 0, unitId: units[0] }, learner: { concepts: { 'concept.inner-quotes': { strength: .4, confidence: .3, dueAt: 88 } }, attempts: [attempt] }, recentVariants: ['quotes-a'] })
    expect(migrateProgress(migrated, '3.0.0', [...ids], [...units])).toEqual(migrated)
  })
  it('rejects malformed schema 2 nested state and enforces bounds during migration', () => {
    const invalid = { schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: { bad: { strength: 'high' } }, attempts: [] }, recentVariants: [] }
    expect(migrateProgress(invalid, '3.0.0', [...ids], [...units])).toEqual(freshProgress('3.0.0'))
  })
  it('bounds migrated attempt and recent-variant history without duplication', () => {
    const attempt = (index: number) => ({ sessionId: 'legacy', exerciseId: ids[0], conceptIds: ['concept.inner-quotes' as const], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: index })
    const legacy = { schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: {}, attempts: Array.from({ length: 120 }, (_, index) => attempt(index)) }, recentVariants: Array.from({ length: 25 }, (_, index) => `variant-${index}`) }
    const migrated = migrateProgress(legacy, '3.0.0', [...ids], [...units]); expect(migrated.learner.attempts).toHaveLength(100); expect(migrated.learner.attempts[0].completedAt).toBe(20); expect(migrated.recentVariants).toHaveLength(20)
  })
  it('survives throwing storage', () => { const broken = { getItem: () => { throw new Error() }, setItem: () => { throw new Error() }, removeItem: () => { throw new Error() } }; expect(createProgressStore(broken, '3.0.0', [...ids], [...units]).load().learner.attempts).toEqual([]) })
})
