import type { ExerciseId } from '../content/model'
import { emptyLearnerState, type AttemptEvidence, type LearnerState } from './learnerModel'
import type { SessionPlan } from './planner'

export const STORAGE_SCHEMA_VERSION = 2
export const STORAGE_KEY = 'vim-xp-progress'
export type StoredSession = SessionPlan & { index: number; completed: boolean }
export type StoredProgress = { schemaVersion: number; curriculumVersion: string; learner: LearnerState; session?: StoredSession; recentVariants: string[] }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface ProgressStore { load(): StoredProgress; save(progress: StoredProgress): void; reset(): void }
export const freshProgress = (curriculumVersion: string): StoredProgress => ({ schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: emptyLearnerState(), recentVariants: [] })

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')
function validAttempt(value: unknown, validIds: Set<string>): value is AttemptEvidence {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<AttemptEvidence>
  return typeof item.sessionId === 'string' && validIds.has(String(item.exerciseId)) && strings(item.conceptIds) && typeof item.correct === 'boolean' && Number.isInteger(item.incorrectChecks) && Number.isInteger(item.hintLevel) && typeof item.demonstrated === 'boolean' && typeof item.skipped === 'boolean' && typeof item.completedAt === 'number'
}
function validSession(value: unknown, validIds: Set<string>): value is StoredSession {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<StoredSession>
  return typeof item.id === 'string' && strings(item.exerciseIds) && item.exerciseIds.length > 0 && item.exerciseIds.every((id) => validIds.has(id)) && Number.isInteger(item.index) && Number(item.index) >= 0 && Number(item.index) < item.exerciseIds.length && typeof item.completed === 'boolean' && typeof item.prescribed === 'boolean' && typeof item.createdAt === 'number' && typeof item.seed === 'number'
}

export function createProgressStore(storage: KeyValueStorage | undefined, curriculumVersion: string, exerciseIds: ExerciseId[]): ProgressStore {
  const validIds = new Set<string>(exerciseIds)
  return {
    load() {
      if (!storage) return freshProgress(curriculumVersion)
      try {
        const value = storage.getItem(STORAGE_KEY)
        if (!value) return freshProgress(curriculumVersion)
        const parsed = JSON.parse(value) as Partial<StoredProgress>
        if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION || parsed.curriculumVersion !== curriculumVersion || !parsed.learner || typeof parsed.learner.concepts !== 'object' || !Array.isArray(parsed.learner.attempts) || !strings(parsed.recentVariants)) return freshProgress(curriculumVersion)
        if (parsed.learner.attempts.some((attempt) => !validAttempt(attempt, validIds)) || (parsed.session !== undefined && !validSession(parsed.session, validIds))) return freshProgress(curriculumVersion)
        return { schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: { concepts: parsed.learner.concepts, attempts: parsed.learner.attempts.slice(-100) }, session: parsed.session, recentVariants: parsed.recentVariants.slice(-20) }
      } catch { return freshProgress(curriculumVersion) }
    },
    save(progress) { try { storage?.setItem(STORAGE_KEY, JSON.stringify({ ...progress, learner: { ...progress.learner, attempts: progress.learner.attempts.slice(-100) }, recentVariants: progress.recentVariants.slice(-20) })) } catch { /* local practice remains available */ } },
    reset() { try { storage?.removeItem(STORAGE_KEY) } catch { /* unavailable storage */ } },
  }
}

export function migrateProgress(_legacy: unknown, curriculumVersion: string): StoredProgress { return freshProgress(curriculumVersion) }
