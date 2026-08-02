import { describe, expect, it } from 'vitest'
import { emptyLearnerState, learnerLabel, updateLearner, type AttemptEvidence } from './learnerModel'

const now = 1_000_000
const evidence = (values: Partial<AttemptEvidence> = {}): AttemptEvidence => ({ exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: now, ...values })

describe('learner model', () => {
  it('gives independent varied success more strength and confidence than assisted practice', () => {
    const independent = updateLearner(emptyLearnerState(), evidence(), 'quotes-a').concepts['concept.inner-quotes']!
    const assisted = updateLearner(emptyLearnerState(), evidence({ hintLevel: 3, demonstrated: true }), 'quotes-a').concepts['concept.inner-quotes']!
    expect(independent.strength).toBeGreaterThan(assisted.strength)
    expect(independent.confidence).toBeGreaterThan(assisted.confidence)
  })
  it('records misses and demonstrations without treating them as independent mastery', () => {
    const missed = updateLearner(emptyLearnerState(), evidence({ correct: false, incorrectChecks: 1 }), 'quotes-a').concepts['concept.inner-quotes']!
    expect(missed.strength).toBe(0); expect(missed.exposures).toBe(1)
  })
  it('does not lower mastery for skips', () => {
    const learned = updateLearner(emptyLearnerState(), evidence(), 'quotes-a')
    const skipped = updateLearner(learned, evidence({ skipped: true, correct: false }), 'quotes-b').concepts['concept.inner-quotes']!
    expect(skipped.strength).toBe(learned.concepts['concept.inner-quotes']!.strength)
  })
  it('tracks strength separately from confidence and exposes friendly labels', () => {
    const state = updateLearner(emptyLearnerState(), evidence(), 'quotes-a').concepts['concept.inner-quotes']!
    expect(state.strength).not.toBe(state.confidence); expect(learnerLabel(state, now)).toBe('Learning')
  })
})
