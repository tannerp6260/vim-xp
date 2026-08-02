import { describe, expect, it } from 'vitest'
import { curriculum } from '../content/firstExercise'
import { emptyLearnerState, updateLearner } from './learnerModel'
import { planSession } from './planner'
const clock = { now: () => 2_000_000_000 }

describe('session planner', () => {
  it('is deterministic with injected seed and clock', () => expect(planSession(curriculum, emptyLearnerState(), clock, 42, false)).toEqual(planSession(curriculum, emptyLearnerState(), clock, 42, false)))
  it('uses the deliberate seven-exercise first session', () => expect(planSession(curriculum, emptyLearnerState(), clock, 1, true).exerciseIds).toHaveLength(7))
  it('prioritizes weak due work and avoids adjacent variants and high friction', () => {
    let learner = emptyLearnerState()
    learner = updateLearner(learner, { exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: false, incorrectChecks: 2, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 1 }, 'quotes-environment')
    const plan = planSession(curriculum, learner, clock, 7, false)
    const chosen = plan.exerciseIds.map((id) => curriculum.exercises.find((exercise) => exercise.id === id)!)
    expect(chosen.slice(0, 3).some((exercise) => exercise.primaryConcepts[0] === 'concept.inner-quotes')).toBe(true)
    chosen.slice(1).forEach((exercise, index) => { expect(exercise.variantGroupId).not.toBe(chosen[index].variantGroupId); expect(exercise.friction === 'high' && chosen[index].friction === 'high').toBe(false) })
  })
  it('leaves two exercises before resurfacing the same concept when possible', () => {
    const chosen = planSession(curriculum, emptyLearnerState(), clock, 9, false).exerciseIds.map((id) => curriculum.exercises.find((exercise) => exercise.id === id)!)
    chosen.forEach((exercise, index) => { const previous = chosen.slice(0, index).map((item) => item.primaryConcepts[0]).lastIndexOf(exercise.primaryConcepts[0]); if (previous >= 0) expect(index - previous).toBeGreaterThanOrEqual(3) })
  })
  it('can resurface a strong concept only through the seeded slow-ball path', () => {
    const learner = emptyLearnerState()
    learner.concepts['concept.inner-quotes'] = { strength: .95, confidence: .9, successes: 8, exposures: 9, variants: ['quotes-environment'], lastSeenAt: clock.now(), dueAt: clock.now() + 99_000_000, recentExerciseIds: [] }
    const positions = Array.from({ length: 500 }, (_, seed) => planSession(curriculum, learner, clock, seed * 97, false).exerciseIds.slice(0, 2)).filter((ids) => ids.some((id) => id.includes('quotes'))).length
    expect(positions).toBeGreaterThan(0)
    expect(positions).toBeLessThan(500)
  })
})
