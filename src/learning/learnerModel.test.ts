import { describe, expect, it } from 'vitest'
import { emptyLearnerState, learnerLabel, updateLearner, type AttemptEvidence } from './learnerModel'

const now = 1_000_000
const evidence = (values: Partial<AttemptEvidence> = {}): AttemptEvidence => ({ sessionId: 'session-1', exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: now, ...values })
const strength = (values: Partial<AttemptEvidence>) => updateLearner(emptyLearnerState(), evidence(values), 'quotes-a').concepts['concept.inner-quotes']!.strength

describe('learner model', () => {
  it('orders independent, light hint, exact hint, demonstration, and recovered evidence', () => {
    const independent = strength({}); const light = strength({ hintLevel: 1 }); const exact = strength({ hintLevel: 3 }); const demonstrated = strength({ demonstrated: true }); const recovered = strength({ incorrectChecks: 2 })
    expect(independent).toBe(.22); expect(light).toBeCloseTo(.143); expect(exact).toBeCloseTo(.011); expect(demonstrated).toBe(0)
    expect(independent).toBeGreaterThan(light); expect(light).toBeGreaterThan(recovered); expect(recovered).toBeGreaterThan(exact); expect(exact).toBeGreaterThan(demonstrated)
  })
  it('allows a conceptual hint to add modest evidence but exact help almost none', () => { expect(strength({ hintLevel: 2 })).toBeCloseTo(.088); expect(strength({ hintLevel: 4 })).toBe(0) })
  it('records demonstration exposure and confidence without strength', () => { const state = updateLearner(emptyLearnerState(), evidence({ demonstrated: true }), 'quotes-a').concepts['concept.inner-quotes']!; expect(state.strength).toBe(0); expect(state.exposures).toBe(1); expect(state.confidence).toBe(.03) })
  it('does not lower strength for skips', () => { const learned = updateLearner(emptyLearnerState(), evidence(), 'quotes-a'); const skipped = updateLearner(learned, evidence({ skipped: true, correct: false }), 'quotes-b').concepts['concept.inner-quotes']!; expect(skipped.strength).toBe(learned.concepts['concept.inner-quotes']!.strength); expect(skipped.dueAt).toBe(now) })
  it('tracks strength separately from confidence and ignores strategy and response time', () => { const state = updateLearner(emptyLearnerState(), evidence(), 'quotes-a').concepts['concept.inner-quotes']!; expect(state.strength).not.toBe(state.confidence); expect(learnerLabel(state, now)).toBe('Learning') })
})
