import type { ExerciseId, UnitId } from '../content/model'
import { emptyLearnerState, type AttemptEvidence, type LearnerState } from './learnerModel'
import type { SessionPlan } from './planner'
import { PLACEMENT_FORMAT_VERSION, type PlacementRecommendation, type PlacementResult, type PlacementRun } from './placement'

export const STORAGE_SCHEMA_VERSION = 4
export const STORAGE_KEY = 'vim-xp-progress'
export type StoredSession = SessionPlan & { index: number; completed: boolean }
export type StoredProgress = { schemaVersion: number; curriculumVersion: string; learner: LearnerState; session?: StoredSession; placement?: PlacementRun; recentVariants: string[] }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface ProgressStore { load(): StoredProgress; save(progress: StoredProgress): void; reset(): void }
export const freshProgress = (curriculumVersion: string): StoredProgress => ({ schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: emptyLearnerState(), recentVariants: [] })

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')
function validAttempt(value: unknown, validIds: Set<string>): value is AttemptEvidence {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<AttemptEvidence>
  return typeof item.sessionId === 'string' && validIds.has(String(item.exerciseId)) && strings(item.conceptIds) && typeof item.correct === 'boolean' && Number.isInteger(item.incorrectChecks) && Number.isInteger(item.hintLevel) && typeof item.demonstrated === 'boolean' && typeof item.skipped === 'boolean' && typeof item.completedAt === 'number'
}
function validConceptState(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['strength', 'confidence', 'successes', 'exposures', 'lastSeenAt', 'dueAt'].every((key) => typeof item[key] === 'number') && strings(item.variants) && strings(item.recentExerciseIds)
}
function validSession(value: unknown, validIds: Set<string>, validUnitIds: Set<string>, allowMissingUnit = false): value is StoredSession {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<StoredSession>
  return typeof item.id === 'string' && strings(item.exerciseIds) && item.exerciseIds.length > 0 && item.exerciseIds.every((id) => validIds.has(id)) && Number.isInteger(item.index) && Number(item.index) >= 0 && Number(item.index) < item.exerciseIds.length && typeof item.completed === 'boolean' && typeof item.prescribed === 'boolean' && typeof item.createdAt === 'number' && typeof item.seed === 'number' && (allowMissingUnit ? item.unitId === undefined : item.unitId === undefined || validUnitIds.has(String(item.unitId)))
}
function validRecommendation(value: unknown, validUnitIds: Set<string>): value is PlacementRecommendation { if (!value || typeof value !== 'object') return false; const item = value as Partial<PlacementRecommendation>; return typeof item.reason === 'string' && (item.kind === 'adaptive-review' || (item.kind === 'unit' && validUnitIds.has(String(item.unitId)))) }
function validPlacementResult(value: unknown, validIds: Set<string>, validUnitIds: Set<string>, gateIds: Set<string>): value is PlacementResult { if (!value || typeof value !== 'object') return false; const item = value as Partial<PlacementResult>; return typeof item.gateId === 'string' && gateIds.has(item.gateId) && validIds.has(String(item.exerciseId)) && validUnitIds.has(String(item.unitId)) && ['confirmed', 'correct-unattributed', 'unconfirmed'].includes(String(item.outcome)) && (item.strategyId === undefined || typeof item.strategyId === 'string') && typeof item.completedAt === 'number' }
function validPlacement(value: unknown, validIds: Set<string>, validUnitIds: Set<string>, gateIds: Set<string>): value is PlacementRun { if (!value || typeof value !== 'object') return false; const item = value as Partial<PlacementRun>; if (item.formatVersion !== PLACEMENT_FORMAT_VERSION || typeof item.runId !== 'string' || !['active', 'completed'].includes(String(item.status)) || typeof item.startedAt !== 'number' || typeof item.evidenceApplied !== 'boolean' || !Array.isArray(item.results) || item.results.length > gateIds.size || item.results.some((result) => !validPlacementResult(result, validIds, validUnitIds, gateIds)) || new Set(item.results.map((result) => result.gateId)).size !== item.results.length) return false; if (item.currentGateId !== undefined && !gateIds.has(item.currentGateId)) return false; return item.status === 'active' ? item.completedAt === undefined && item.recommendation === undefined : typeof item.completedAt === 'number' && validRecommendation(item.recommendation, validUnitIds) }

export function createProgressStore(storage: KeyValueStorage | undefined, curriculumVersion: string, exerciseIds: ExerciseId[], unitIds: UnitId[] = [], placementGateIds: string[] = []): ProgressStore {
  const validIds = new Set<string>(exerciseIds)
  const validUnitIds = new Set<string>(unitIds)
  const gateIds = new Set(placementGateIds)
  return {
    load() {
      if (!storage) return freshProgress(curriculumVersion)
      try {
        const value = storage.getItem(STORAGE_KEY)
        if (!value) return freshProgress(curriculumVersion)
        const raw = JSON.parse(value) as Partial<StoredProgress>
        const parsed = (raw.schemaVersion === 2 && raw.curriculumVersion === '2.0.0') || (raw.schemaVersion === 3 && raw.curriculumVersion === '3.0.0') ? migrateProgress(raw, curriculumVersion, exerciseIds, unitIds) : raw
        if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION || parsed.curriculumVersion !== curriculumVersion || !parsed.learner || !parsed.learner.concepts || typeof parsed.learner.concepts !== 'object' || Array.isArray(parsed.learner.concepts) || !Array.isArray(parsed.learner.attempts) || !strings(parsed.recentVariants)) return freshProgress(curriculumVersion)
        if (Object.values(parsed.learner.concepts).some((state) => !validConceptState(state)) || parsed.learner.attempts.some((attempt) => !validAttempt(attempt, validIds)) || (parsed.session !== undefined && !validSession(parsed.session, validIds, validUnitIds)) || (parsed.placement !== undefined && !validPlacement(parsed.placement, validIds, validUnitIds, gateIds))) return freshProgress(curriculumVersion)
        return { schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: { concepts: parsed.learner.concepts, attempts: parsed.learner.attempts.slice(-100) }, session: parsed.session, placement: parsed.placement, recentVariants: parsed.recentVariants.slice(-20) }
      } catch { return freshProgress(curriculumVersion) }
    },
    save(progress) { try { storage?.setItem(STORAGE_KEY, JSON.stringify({ ...progress, learner: { ...progress.learner, attempts: progress.learner.attempts.slice(-100) }, recentVariants: progress.recentVariants.slice(-20) })) } catch { /* local practice remains available */ } },
    reset() { try { storage?.removeItem(STORAGE_KEY) } catch { /* unavailable storage */ } },
  }
}

export function migrateProgress(legacy: unknown, curriculumVersion: string, exerciseIds: ExerciseId[] = [], unitIds: UnitId[] = []): StoredProgress {
  if (!legacy || typeof legacy !== 'object') return freshProgress(curriculumVersion)
  const parsed = legacy as Partial<StoredProgress>
  if (parsed.schemaVersion === STORAGE_SCHEMA_VERSION && parsed.curriculumVersion === curriculumVersion) return parsed as StoredProgress
  const from2 = parsed.schemaVersion === 2 && parsed.curriculumVersion === '2.0.0'; const from3 = parsed.schemaVersion === 3 && parsed.curriculumVersion === '3.0.0'
  if ((!from2 && !from3) || !parsed.learner || !parsed.learner.concepts || typeof parsed.learner.concepts !== 'object' || Array.isArray(parsed.learner.concepts) || !Array.isArray(parsed.learner.attempts) || !strings(parsed.recentVariants)) return freshProgress(curriculumVersion)
  const validIds = new Set<string>(exerciseIds); const validUnitIds = new Set<string>(unitIds)
  if (Object.values(parsed.learner.concepts).some((state) => !validConceptState(state)) || parsed.learner.attempts.some((attempt) => !validAttempt(attempt, validIds)) || (parsed.session !== undefined && !validSession(parsed.session, validIds, validUnitIds, from2))) return freshProgress(curriculumVersion)
  const session = parsed.session ? { ...parsed.session, unitId: from2 ? 'unit.precise-text-objects' as UnitId : parsed.session.unitId } : undefined
  if (session && validUnitIds.size > 0 && !validUnitIds.has(session.unitId!)) return freshProgress(curriculumVersion)
  return { schemaVersion: STORAGE_SCHEMA_VERSION, curriculumVersion, learner: { concepts: parsed.learner.concepts, attempts: parsed.learner.attempts.slice(-100) }, session, recentVariants: parsed.recentVariants.slice(-20) }
}
