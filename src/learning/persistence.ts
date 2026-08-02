import type { ExerciseId } from '../content/model'
import { emptyLearnerState, type LearnerState } from './learnerModel'
import type { SessionPlan } from './planner'

export const STORAGE_SCHEMA_VERSION = 1
export const STORAGE_KEY = 'vim-xp-progress'
export type StoredProgress = { schemaVersion: number; curriculumVersion: string; learner: LearnerState; session?: SessionPlan & { index: number; completed: boolean }; recentVariants: string[] }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface ProgressStore { load(): StoredProgress; save(progress: StoredProgress): void; reset(): void }
export const freshProgress = (curriculumVersion: string): StoredProgress => ({ schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: emptyLearnerState(), recentVariants: [] })

export function createProgressStore(storage: KeyValueStorage | undefined, curriculumVersion: string): ProgressStore {
  const fallback = freshProgress(curriculumVersion)
  return {
    load() {
      if (!storage) return fallback
      try {
        const value = storage.getItem(STORAGE_KEY)
        if (!value) return freshProgress(curriculumVersion)
        const parsed = JSON.parse(value) as Partial<StoredProgress>
        if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION || !parsed.learner?.concepts || !Array.isArray(parsed.learner.attempts)) return freshProgress(curriculumVersion)
        return { ...parsed, curriculumVersion, learner: { ...parsed.learner, attempts: parsed.learner.attempts.slice(-100) }, recentVariants: (parsed.recentVariants ?? []).slice(-20) } as StoredProgress
      } catch { return freshProgress(curriculumVersion) }
    },
    save(progress) { try { storage?.setItem(STORAGE_KEY, JSON.stringify({ ...progress, learner: { ...progress.learner, attempts: progress.learner.attempts.slice(-100) }, recentVariants: progress.recentVariants.slice(-20) })) } catch { /* local practice remains available */ } },
    reset() { try { storage?.removeItem(STORAGE_KEY) } catch { /* unavailable storage */ } },
  }
}

export function migrateProgress(_legacy: unknown, curriculumVersion: string): StoredProgress { return freshProgress(curriculumVersion) }
export type SessionResume = { id: string; exerciseIds: ExerciseId[]; index: number }
