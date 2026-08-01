import type { Exercise } from './model'
import type { EvaluationResult } from './evaluator'

export type Coaching = { kind: 'success' | 'document' | 'mode'; strategyId?: string; message: string }

function traceEquals(actual: string[], expected: string[]) {
  return actual.length === expected.length && actual.every((token, index) => token === expected[index])
}

export function coachAttempt(exercise: Exercise, evaluation: EvaluationResult, trace: string[]): Coaching {
  if (!evaluation.passed) {
    const documentIssue = evaluation.issues.find((issue) => issue.type === 'document-mismatch')
    if (documentIssue) return { kind: 'document', message: 'The environment value does not match the goal yet. Keep the surrounding quotation marks and change only the value.' }
    return { kind: 'mode', message: 'The text is correct. Press Escape to return to Normal mode, then check again.' }
  }

  const strategy = exercise.strategies.find((candidate) => traceEquals(trace, candidate.trace))
  if (strategy) return { kind: 'success', strategyId: strategy.id, message: strategy.coaching }
  return { kind: 'success', message: 'Correct — the document and final mode match the goal. Vim often has several valid ways to make the same edit.' }
}
