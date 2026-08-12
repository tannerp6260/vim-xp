import type { ConceptId, Curriculum, ExerciseId, PlacementGate, UnitId } from '../content/model'
import type { LearnerState } from './learnerModel'

export const PLACEMENT_FORMAT_VERSION = 1
export type PlacementOutcome = 'confirmed' | 'correct-unattributed' | 'unconfirmed'
export type PlacementRecommendation = { kind: 'unit'; unitId: UnitId; reason: string } | { kind: 'adaptive-review'; reason: string }
export type PlacementResult = { gateId: string; exerciseId: ExerciseId; unitId: UnitId; outcome: PlacementOutcome; strategyId?: string; completedAt: number }
export type PlacementRun = { formatVersion: number; runId: string; status: 'active' | 'completed'; startedAt: number; completedAt?: number; currentGateId?: string; results: PlacementResult[]; recommendation?: PlacementRecommendation; evidenceApplied: boolean }

export const requiredGates = (curriculum: Curriculum) => [...curriculum.placementGates].filter((gate) => gate.role === 'required').sort((a, b) => a.priority - b.priority)
const confirmationGate = (curriculum: Curriculum) => curriculum.placementGates.find((gate) => gate.role === 'confirmation')
const resultFor = (run: PlacementRun, gate: PlacementGate) => run.results.find((result) => result.gateId === gate.id)
const practiceSatisfies = (gate: PlacementGate, learner: LearnerState) => gate.conceptIds.every((id) => { const state = learner.concepts[id]; return Boolean(state && state.strength >= .8 && state.confidence >= .55) })
export const gateConfirmed = (gate: PlacementGate, run: PlacementRun | undefined, learner: LearnerState) => resultFor(run ?? emptyPlacementRun('', 0), gate)?.outcome === 'confirmed' || practiceSatisfies(gate, learner)

export function emptyPlacementRun(runId: string, now: number): PlacementRun { return { formatVersion: PLACEMENT_FORMAT_VERSION, runId, status: 'active', startedAt: now, results: [], evidenceApplied: false } }

export function nextPlacementGate(curriculum: Curriculum, run: PlacementRun): PlacementGate | undefined {
  const remaining = requiredGates(curriculum).find((gate) => !run.results.some((result) => result.gateId === gate.id))
  if (remaining) return remaining
  const unitOne = requiredGates(curriculum).filter((gate) => gate.unitId === 'unit.precise-text-objects')
  const split = unitOne.map((gate) => resultFor(run, gate)?.outcome === 'confirmed').filter(Boolean).length === 1
  const optional = confirmationGate(curriculum)
  return split && optional && !run.results.some((result) => result.gateId === optional.id) ? optional : undefined
}

export function placementRecommendation(curriculum: Curriculum, learner: LearnerState, run?: PlacementRun): PlacementRecommendation {
  const ordered = [...curriculum.units].sort((a, b) => a.order - b.order)
  const confirmed = (unitId: UnitId) => curriculum.placementGates.filter((gate) => gate.unitId === unitId && gate.requiredToSkipIntroduction).every((gate) => gateConfirmed(gate, run, learner))
  const firstUnconfirmed = ordered.find((unit) => !confirmed(unit.id))
  if (firstUnconfirmed) return { kind: 'unit', unitId: firstUnconfirmed.id, reason: `Continue with ${firstUnconfirmed.title}, the earliest unit placement could not yet confirm.` }
  return { kind: 'adaptive-review', reason: 'Placement confirmed the required techniques across all current units.' }
}

export function completePlacementRun(curriculum: Curriculum, learner: LearnerState, run: PlacementRun, now: number): PlacementRun {
  if (nextPlacementGate(curriculum, run)) return run
  return { ...run, status: 'completed', currentGateId: undefined, completedAt: now, recommendation: placementRecommendation(curriculum, learner, run) }
}

export function recordPlacementResult(curriculum: Curriculum, learner: LearnerState, run: PlacementRun, result: PlacementResult): PlacementRun {
  if (run.status !== 'active' || run.results.some((item) => item.gateId === result.gateId) || nextPlacementGate(curriculum, run)?.id !== result.gateId) return run
  const updated = { ...run, results: [...run.results, result], currentGateId: undefined }
  const next = nextPlacementGate(curriculum, updated)
  return next ? { ...updated, currentGateId: next.id } : completePlacementRun(curriculum, learner, updated, result.completedAt)
}

const DAY = 86_400_000
export function applyPlacementEvidence(curriculum: Curriculum, learner: LearnerState, run: PlacementRun): { learner: LearnerState; run: PlacementRun } {
  if (run.evidenceApplied || run.status !== 'completed') return { learner, run }
  const concepts = { ...learner.concepts }
  for (const result of run.results.filter((item) => item.outcome === 'confirmed')) {
    const gate = curriculum.placementGates.find((item) => item.id === result.gateId); const exercise = curriculum.exercises.find((item) => item.id === result.exerciseId); const strategy = exercise?.strategies.find((item) => item.id === result.strategyId)
    if (!gate || !exercise || !strategy) continue
    for (const id of gate.conceptIds.filter((concept) => strategy.creditedConceptIds.includes(concept))) {
      const old = concepts[id] ?? { strength: 0, confidence: 0, successes: 0, exposures: 0, variants: [], lastSeenAt: 0, dueAt: 0, recentExerciseIds: [] }
      concepts[id] = { ...old, strength: Math.max(old.strength, .6), confidence: Math.max(old.confidence, .35), successes: Math.max(old.successes, 1), exposures: Math.max(old.exposures, 1), variants: [exercise.variantGroupId, ...old.variants.filter((item) => item !== exercise.variantGroupId)].slice(0, 6), lastSeenAt: Math.max(old.lastSeenAt, result.completedAt), dueAt: Math.max(old.dueAt, result.completedAt + 3 * DAY), recentExerciseIds: [exercise.id, ...old.recentExerciseIds.filter((item) => item !== exercise.id)].slice(0, 5) }
    }
  }
  return { learner: { ...learner, concepts }, run: { ...run, evidenceApplied: true } }
}

export function confirmedConceptIds(curriculum: Curriculum, run: PlacementRun): ConceptId[] { return [...new Set(run.results.filter((item) => item.outcome === 'confirmed').flatMap((result) => curriculum.placementGates.find((gate) => gate.id === result.gateId)?.conceptIds ?? []))] }
