import { describe, expect, it } from 'vitest'
import { coachAttempt } from './coaching'
import { evaluateOutcome } from './evaluator'
import { changeInsideQuotesExercise, finalDocument } from './firstExercise'

describe('outcome evaluation', () => {
  it('evaluates exact document text', () => {
    expect(evaluateOutcome({ type: 'exact-document', text: 'done' }, { document: 'done', mode: 'normal' }).passed).toBe(true)
    expect(evaluateOutcome({ type: 'exact-document', text: 'done' }, { document: 'almost', mode: 'normal' }).issues[0]?.type).toBe('document-mismatch')
  })

  it('evaluates the required final mode', () => {
    expect(evaluateOutcome({ type: 'required-mode', mode: 'normal' }, { document: '', mode: 'normal' }).passed).toBe(true)
    expect(evaluateOutcome({ type: 'required-mode', mode: 'normal' }, { document: '', mode: 'insert' }).issues[0]?.type).toBe('mode-mismatch')
  })

  it('composes rules with logical all', () => {
    const result = evaluateOutcome({ type: 'all', rules: [{ type: 'exact-document', text: 'done' }, { type: 'required-mode', mode: 'normal' }] }, { document: 'done', mode: 'insert' })
    expect(result).toMatchObject({ passed: false, issues: [{ type: 'mode-mismatch' }] })
  })
})

describe('correctness and coaching', () => {
  const passed = evaluateOutcome(changeInsideQuotesExercise.outcome, { document: finalDocument, mode: 'normal' })

  it('passes a correct outcome even when the strategy is unknown', () => {
    expect(passed.passed).toBe(true)
    expect(coachAttempt(changeInsideQuotesExercise, passed, ['unknown']).kind).toBe('success')
    expect(coachAttempt(changeInsideQuotesExercise, passed, ['unknown']).strategyId).toBeUndefined()
  })

  it('recognizes intended and known equivalent strategies only after correctness', () => {
    const intended = coachAttempt(changeInsideQuotesExercise, passed, changeInsideQuotesExercise.strategies[0].trace)
    const equivalent = coachAttempt(changeInsideQuotesExercise, passed, changeInsideQuotesExercise.strategies[1].trace)
    expect(intended).toMatchObject({ kind: 'success', strategyId: 'change-inner-quotes' })
    expect(equivalent).toMatchObject({ kind: 'success', strategyId: 'delete-inner-then-insert' })
  })

  it('gives mode-specific feedback when the document is correct', () => {
    const evaluation = evaluateOutcome(changeInsideQuotesExercise.outcome, { document: finalDocument, mode: 'insert' })
    expect(coachAttempt(changeInsideQuotesExercise, evaluation, []).kind).toBe('mode')
  })
})
