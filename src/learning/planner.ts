import type { Curriculum, Exercise, ExerciseId, UnitId } from '../content/model'
import type { LearnerState } from './learnerModel'

export type Clock = { now(): number }
export type SessionPlan = { id: string; exerciseIds: ExerciseId[]; prescribed: boolean; createdAt: number; seed: number; unitId?: UnitId }
function random(seed: number) { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296 } }
const score = (exercise: Exercise, learner: LearnerState, now: number, roll: number, recentVariants: string[]) => {
  const state = learner.concepts[exercise.primaryConcepts[0]]
  const recentPenalty = recentVariants.includes(exercise.variantGroupId) ? 28 : 0
  if (!state) return 70 - exercise.difficulty.level * 3 + roll - recentPenalty
  const due = state.dueAt <= now ? 45 : 0
  const weak = (1 - state.strength) * 50
  const slowBall = state.strength >= .8 ? (roll > .96 ? 80 : -25) : 0
  return due + weak + slowBall - (state.recentExerciseIds.includes(exercise.id) ? 35 : 0) - recentPenalty + roll
}

const encountered = (curriculum: Curriculum, learner: LearnerState, unitId: UnitId) => {
  const ids = new Set(curriculum.units.find((unit) => unit.id === unitId)?.exerciseIds ?? [])
  return learner.attempts.some((attempt) => ids.has(attempt.exerciseId))
}

export function recommendedUnitId(curriculum: Curriculum, learner: LearnerState): UnitId {
  const units = [...curriculum.units].sort((a, b) => a.order - b.order)
  return units.find((unit) => !encountered(curriculum, learner, unit.id))?.id ?? units.at(-1)!.id
}

export function planSession(curriculum: Curriculum, learner: LearnerState, clock: Clock, seed: number, firstSession: boolean, recentVariants: string[] = [], focusedUnitId?: UnitId): SessionPlan {
  const now = clock.now()
  const ordered = [...curriculum.units].sort((a, b) => a.order - b.order)
  const focus = focusedUnitId ? curriculum.units.find((unit) => unit.id === focusedUnitId) : undefined
  const prescribedUnit = firstSession ? ordered[0] : focus && !encountered(curriculum, learner, focus.id) ? focus : undefined
  if (prescribedUnit) return { id: `session-${now}-${seed}`, exerciseIds: [...prescribedUnit.prescribedExerciseIds], prescribed: true, createdAt: now, seed, unitId: prescribedUnit.id }
  const rand = random(seed)
  const focusIds = new Set(focus?.exerciseIds ?? curriculum.exercises.map((exercise) => exercise.id))
  const reviewIds = new Set(focus?.recommendedPrerequisiteUnitIds.flatMap((id) => curriculum.units.find((unit) => unit.id === id)?.exerciseIds ?? []) ?? [])
  const pool = focus ? curriculum.exercises.filter((exercise) => focusIds.has(exercise.id) || reviewIds.has(exercise.id)) : curriculum.exercises
  const ranked = pool.map((exercise) => ({ exercise, score: score(exercise, learner, now, rand(), recentVariants) + (focusIds.has(exercise.id) ? 18 : 0) })).sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id))
  const result: Exercise[] = []
  while (result.length < Math.min(7, pool.length)) {
    const focusCount = result.filter((exercise) => focusIds.has(exercise.id)).length
    const reviewCount = result.length - focusCount
    const eligible = ranked.filter(({ exercise }) => !result.includes(exercise) && (!focus || (focusIds.has(exercise.id) ? focusCount < 5 || reviewIds.size === 0 : reviewCount < 2)))
    const previous = result.at(-1)
    const choice = eligible.find(({ exercise }) => exercise.variantGroupId !== previous?.variantGroupId && !(exercise.friction === 'high' && previous?.friction === 'high') && !result.slice(-2).some((item) => item.primaryConcepts[0] === exercise.primaryConcepts[0]))
      ?? eligible.find(({ exercise }) => exercise.variantGroupId !== previous?.variantGroupId && !(exercise.friction === 'high' && previous?.friction === 'high')) ?? eligible[0]
    if (!choice) break
    result.push(choice.exercise)
  }
  return { id: `session-${now}-${seed}`, exerciseIds: result.map((item) => item.id), prescribed: false, createdAt: now, seed, unitId: focus?.id }
}
