import type { OutcomeRule, VimMode } from './model'

export type OutcomeState = { document: string; mode: VimMode | string; cursor?: number }
export type OutcomeIssue =
  | { type: 'document-mismatch'; expected: string; actual: string }
  | { type: 'mode-mismatch'; expected: VimMode; actual: string }
  | { type: 'cursor-mismatch'; expected: number; actual: number | undefined }

export type EvaluationResult = { passed: boolean; issues: OutcomeIssue[] }

export function evaluateOutcome(rule: OutcomeRule, state: OutcomeState): EvaluationResult {
  switch (rule.type) {
    case 'exact-document': {
      const issues: OutcomeIssue[] = state.document === rule.text ? [] : [{ type: 'document-mismatch', expected: rule.text, actual: state.document }]
      return { passed: issues.length === 0, issues }
    }
    case 'required-mode': {
      const issues: OutcomeIssue[] = state.mode === rule.mode ? [] : [{ type: 'mode-mismatch', expected: rule.mode, actual: state.mode }]
      return { passed: issues.length === 0, issues }
    }
    case 'cursor-at': {
      const issues: OutcomeIssue[] = state.cursor === rule.offset ? [] : [{ type: 'cursor-mismatch', expected: rule.offset, actual: state.cursor }]
      return { passed: issues.length === 0, issues }
    }
    case 'all': {
      const issues = rule.rules.flatMap((child) => evaluateOutcome(child, state).issues)
      return { passed: issues.length === 0, issues }
    }
  }
}
