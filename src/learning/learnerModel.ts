import type { ConceptId, ExerciseId } from '../content/model'

export type AttemptEvidence = { exerciseId: ExerciseId; conceptIds: ConceptId[]; correct: boolean; incorrectChecks: number; hintLevel: number; demonstrated: boolean; skipped: boolean; completedAt: number }
export type ConceptState = { strength: number; confidence: number; successes: number; exposures: number; variants: string[]; lastSeenAt: number; dueAt: number; recentExerciseIds: ExerciseId[] }
export type LearnerState = { concepts: Partial<Record<ConceptId, ConceptState>>; attempts: AttemptEvidence[] }
export const emptyLearnerState = (): LearnerState => ({ concepts: {}, attempts: [] })
const DAY = 86_400_000
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function updateLearner(state: LearnerState, evidence: AttemptEvidence, variantGroupId: string): LearnerState {
  const concepts = { ...state.concepts }
  for (const id of evidence.conceptIds) {
    const old = concepts[id] ?? { strength: 0, confidence: 0, successes: 0, exposures: 0, variants: [], lastSeenAt: 0, dueAt: 0, recentExerciseIds: [] }
    if (evidence.skipped) {
      concepts[id] = { ...old, lastSeenAt: evidence.completedAt, dueAt: evidence.completedAt, recentExerciseIds: [evidence.exerciseId, ...old.recentExerciseIds.filter((item) => item !== evidence.exerciseId)].slice(0, 5) }
      continue
    }
    const independent = evidence.correct && evidence.hintLevel < 3 && !evidence.demonstrated
    const assistance = evidence.hintLevel * .05 + (evidence.demonstrated ? .2 : 0)
    const strengthDelta = evidence.correct ? Math.max(.04, .22 - assistance - Math.min(.08, evidence.incorrectChecks * .03)) : -.12
    const varied = !old.variants.includes(variantGroupId)
    const confidenceDelta = independent ? (varied ? .18 : .09) : evidence.correct ? .03 : .02
    const strength = clamp(old.strength + strengthDelta)
    concepts[id] = { strength, confidence: clamp(old.confidence + confidenceDelta), successes: old.successes + (evidence.correct ? 1 : 0), exposures: old.exposures + 1,
      variants: [variantGroupId, ...old.variants.filter((item) => item !== variantGroupId)].slice(0, 6), lastSeenAt: evidence.completedAt,
      dueAt: evidence.completedAt + DAY * (strength >= .8 ? 14 : strength >= .55 ? 5 : 1), recentExerciseIds: [evidence.exerciseId, ...old.recentExerciseIds.filter((item) => item !== evidence.exerciseId)].slice(0, 5) }
  }
  return { concepts, attempts: [...state.attempts, evidence].slice(-100) }
}

export type LearnerLabel = 'New' | 'Learning' | 'Familiar' | 'Strong' | 'Due'
export function learnerLabel(state: ConceptState | undefined, now: number): LearnerLabel {
  if (!state?.exposures) return 'New'
  if (state.dueAt <= now) return 'Due'
  if (state.strength >= .8 && state.confidence >= .55) return 'Strong'
  if (state.strength >= .55) return 'Familiar'
  return 'Learning'
}
