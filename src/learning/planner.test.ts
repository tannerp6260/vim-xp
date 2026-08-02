import { describe, expect, it } from 'vitest'
import { curriculum } from '../content/firstExercise'
import { emptyLearnerState, updateLearner } from './learnerModel'
import { planSession, recommendedUnitId } from './planner'
const clock = { now: () => 2_000_000_000 }

describe('session planner', () => {
  it('is deterministic with injected seed and clock', () => expect(planSession(curriculum, emptyLearnerState(), clock, 42, false)).toEqual(planSession(curriculum, emptyLearnerState(), clock, 42, false)))
  it('uses the unchanged deliberate first session for a fresh learner', () => expect(planSession(curriculum, emptyLearnerState(), clock, 1, true)).toMatchObject({ unitId: 'unit.precise-text-objects', prescribed: true, exerciseIds: ['exercise.change-inside-quotes', 'exercise.quotes-cmake-build-type', 'exercise.word-shell-target', 'exercise.quotes-shell-base-url', 'exercise.parens-clear-cache-args', 'exercise.word-cpp-log-level', 'exercise.parens-run-checks'] }))
  it('allows advanced direct access to the prescribed second unit', () => expect(planSession(curriculum, emptyLearnerState(), clock, 1, false, [], 'unit.line-targeting')).toMatchObject({ unitId: 'unit.line-targeting', prescribed: true, exerciseIds: ['exercise.line-find-assignment', 'exercise.line-till-shell-quote', 'exercise.line-find-cmake-paren', 'exercise.line-repeat-path-colon', 'exercise.line-change-first-argument', 'exercise.line-reverse-cpp-comma', 'exercise.line-change-shell-semicolon'] }))
  it('recommends line targeting after the first unit has been encountered', () => {
    const learner = updateLearner(emptyLearnerState(), { sessionId: 'one', exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 1 }, 'quotes-environment')
    expect(recommendedUnitId(curriculum, emptyLearnerState())).toBe('unit.precise-text-objects'); expect(recommendedUnitId(curriculum, learner)).toBe('unit.line-targeting')
  })
  it('builds later focused sessions with five focus and two prerequisite reviews', () => {
    const learner = updateLearner(emptyLearnerState(), { sessionId: 'line', exerciseId: 'exercise.line-find-assignment', conceptIds: ['concept.find-forward'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 1 }, 'line-find-assignment')
    const plan = planSession(curriculum, learner, clock, 44, false, [], 'unit.line-targeting'); const lineIds = new Set(curriculum.units[1].exerciseIds)
    expect(plan.exerciseIds.filter((id) => lineIds.has(id)).length).toBe(5); expect(plan.exerciseIds.filter((id) => !lineIds.has(id)).length).toBe(2)
  })
  it('prioritizes weak due work and avoids adjacent variants and high friction', () => {
    let learner = emptyLearnerState()
    learner = updateLearner(learner, { sessionId: 'session-1', exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: false, incorrectChecks: 2, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 1 }, 'quotes-environment')
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
  it('penalizes variants used by the prior session when alternatives exist', () => {
    const first = planSession(curriculum, emptyLearnerState(), clock, 31, false)
    const recent = first.exerciseIds.map((id) => curriculum.exercises.find((exercise) => exercise.id === id)!.variantGroupId)
    const withoutHistory = planSession(curriculum, emptyLearnerState(), clock, 99, false)
    const withHistory = planSession(curriculum, emptyLearnerState(), clock, 99, false, recent)
    const overlap = (ids: typeof withHistory.exerciseIds) => ids.slice(0, 2).filter((id) => recent.includes(curriculum.exercises.find((exercise) => exercise.id === id)!.variantGroupId)).length
    expect(overlap(withHistory.exerciseIds)).toBeLessThanOrEqual(overlap(withoutHistory.exerciseIds))
    expect(withHistory.exerciseIds).not.toEqual(withoutHistory.exerciseIds)
  })
})
