import type { Curriculum, Exercise, ExerciseId } from '../content/model'
import { firstSessionExerciseIds } from '../content/firstExercise'
import type { LearnerState } from './learnerModel'

export type Clock = { now(): number }
export type SessionPlan = { id: string; exerciseIds: ExerciseId[]; prescribed: boolean; createdAt: number; seed: number }
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

export function planSession(curriculum: Curriculum, learner: LearnerState, clock: Clock, seed: number, firstSession: boolean, recentVariants: string[] = []): SessionPlan {
  const now = clock.now()
  if (firstSession) return { id: `session-${now}-${seed}`, exerciseIds: [...firstSessionExerciseIds], prescribed: true, createdAt: now, seed }
  const rand = random(seed)
  const ranked = curriculum.exercises.map((exercise) => ({ exercise, score: score(exercise, learner, now, rand(), recentVariants) })).sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id))
  const result: Exercise[] = []
  while (result.length < Math.min(7, curriculum.exercises.length)) {
    const eligible = ranked.filter(({ exercise }) => !result.includes(exercise))
    const previous = result.at(-1)
    const choice = eligible.find(({ exercise }) => exercise.variantGroupId !== previous?.variantGroupId && !(exercise.friction === 'high' && previous?.friction === 'high') && !result.slice(-2).some((item) => item.primaryConcepts[0] === exercise.primaryConcepts[0]))
      ?? eligible.find(({ exercise }) => exercise.variantGroupId !== previous?.variantGroupId && !(exercise.friction === 'high' && previous?.friction === 'high')) ?? eligible[0]
    if (!choice) break
    result.push(choice.exercise)
  }
  return { id: `session-${now}-${seed}`, exerciseIds: result.map((item) => item.id), prescribed: false, createdAt: now, seed }
}
