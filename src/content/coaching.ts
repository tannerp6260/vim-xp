import type { Exercise } from './model'
import type { EvaluationResult } from './evaluator'

export type Coaching = { kind: 'success' | 'document' | 'mode' | 'cursor'; strategyId?: string; message: string }

function traceEquals(actual: string[], expected: string[]) {
  return actual.length === expected.length && actual.every((token, index) => token === expected[index])
}

export function coachAttempt(exercise: Exercise, evaluation: EvaluationResult, trace: string[]): Coaching {
  if (!evaluation.passed) {
    const documentIssue = evaluation.issues.find((issue) => issue.type === 'document-mismatch')
    if (documentIssue) return { kind: 'document', message: exercise.outcome.type === 'all' && exercise.outcome.rules.some((rule) => rule.type === 'cursor-at') ? 'The text changed, but this task is only about moving the cursor. Reset the exercise and try the movement again.' : 'The document does not match the goal yet. Compare the target text and surrounding structure, then keep going.' }
    const cursorIssue = evaluation.issues.find((issue) => issue.type === 'cursor-mismatch')
    if (cursorIssue) return { kind: 'cursor', message: 'The document is unchanged, but the cursor has not reached the requested destination yet.' }
    return { kind: 'mode', message: 'The outcome is correct except for the mode. Press Escape to return to Normal mode, then check again.' }
  }

  const strategy = exercise.strategies.find((candidate) => traceEquals(trace, candidate.trace))
  if (strategy) return { kind: 'success', strategyId: strategy.id, message: strategy.coaching }
  return { kind: 'success', message: 'Correct — the requested editor outcome matches the goal. Vim often has several valid ways to get there.' }
}
