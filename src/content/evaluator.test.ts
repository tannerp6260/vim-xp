import { describe, expect, it } from 'vitest'
import { coachAttempt } from './coaching'
import { evaluateOutcome } from './evaluator'
import { changeInsideQuotesExercise, curriculum, finalDocument } from './firstExercise'

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

  it('evaluates an exact cursor outcome', () => {
    expect(evaluateOutcome({ type: 'cursor-at', offset: 4 }, { document: 'value', mode: 'normal', cursor: 4 }).passed).toBe(true)
    expect(evaluateOutcome({ type: 'cursor-at', offset: 4 }, { document: 'value', mode: 'normal', cursor: 2 }).issues[0]).toMatchObject({ type: 'cursor-mismatch', expected: 4, actual: 2 })
  })
})

describe('cursor coaching', () => {
  const exercise = curriculum.exercises.find((item) => item.id === 'exercise.line-find-assignment')!
  it('distinguishes wrong cursor, changed text, and wrong mode', () => {
    expect(coachAttempt(exercise, evaluateOutcome(exercise.outcome, { document: exercise.initial.document, cursor: 0, mode: 'normal' }), []).kind).toBe('cursor')
    expect(coachAttempt(exercise, evaluateOutcome(exercise.outcome, { document: `${exercise.initial.document}x`, cursor: 0, mode: 'normal' }), []).kind).toBe('document')
    const target = exercise.initial.document.indexOf('='); expect(coachAttempt(exercise, evaluateOutcome(exercise.outcome, { document: exercise.initial.document, cursor: target, mode: 'insert' }), []).kind).toBe('mode')
  })
  it('passes unknown correct movement strategies', () => { const target = exercise.initial.document.indexOf('='); const coaching = coachAttempt(exercise, evaluateOutcome(exercise.outcome, { document: exercise.initial.document, cursor: target, mode: 'normal' }), ['l', 'l']); expect(coaching.kind).toBe('success'); expect(coaching.strategyId).toBeUndefined() })
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
