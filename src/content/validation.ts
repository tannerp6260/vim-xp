import type { Curriculum, Exercise, OutcomeRule } from './model'
import { evaluateOutcome } from './evaluator'

export class ContentValidationError extends Error {}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContentValidationError(message)
}

function validateRule(rule: OutcomeRule, context: string): void {
  assert(rule && typeof rule === 'object' && 'type' in rule, `${context} has an invalid outcome rule`)
  if (rule.type === 'exact-document') return assert(typeof rule.text === 'string', `${context} exact-document rule requires text`)
  if (rule.type === 'required-mode') return assert(['normal', 'insert', 'visual'].includes(rule.mode), `${context} required-mode rule has an invalid mode`)
  if (rule.type === 'all') {
    assert(Array.isArray(rule.rules) && rule.rules.length > 0, `${context} all rule must contain rules`)
    rule.rules.forEach((child) => validateRule(child, context))
    return
  }
  throw new ContentValidationError(`${context} uses unsupported outcome-rule type: ${String((rule as { type?: unknown }).type)}`)
}

function validatePosition(position: number, document: string, label: string) {
  assert(Number.isInteger(position) && position >= 0 && position <= document.length, `${label} is outside the initial document`)
}

export function validateCurriculum(curriculum: Curriculum): Curriculum {
  const ids = [...curriculum.concepts.map((item) => item.id), ...curriculum.exercises.map((item) => item.id)]
  assert(new Set(ids).size === ids.length, 'Curriculum IDs must be unique')
  const conceptIds = new Set(curriculum.concepts.map((concept) => concept.id))
  curriculum.exercises.forEach((exercise) => {
    assert(exercise.prompt.trim(), `${exercise.id} has an empty prompt`)
    assert(exercise.hints.length > 0 && exercise.hints.every((hint) => hint.trim()), `${exercise.id} has an empty hint ladder`)
    validatePosition(exercise.initial.cursor, exercise.initial.document, `${exercise.id} cursor`)
    if (exercise.initial.selection) {
      validatePosition(exercise.initial.selection.anchor, exercise.initial.document, `${exercise.id} selection anchor`)
      validatePosition(exercise.initial.selection.head, exercise.initial.document, `${exercise.id} selection head`)
    }
    ;[...exercise.primaryConcepts, ...exercise.supportingConcepts].forEach((id) => assert(conceptIds.has(id), `${exercise.id} references unknown concept ${id}`))
    validateRule(exercise.outcome, exercise.id)
    assert(exercise.referenceSolutions.length > 0 && exercise.referenceSolutions.every((solution) => solution.tokens.length > 0), `${exercise.id} has an empty reference solution`)
  })
  return curriculum
}

export type ReferenceReplay = (exercise: Exercise, tokens: string[]) => Promise<{ document: string; mode: string }>

export async function validateReferenceSolutions(curriculum: Curriculum, replay: ReferenceReplay): Promise<void> {
  for (const exercise of curriculum.exercises) {
    for (const solution of exercise.referenceSolutions) {
      const result = evaluateOutcome(exercise.outcome, await replay(exercise, solution.tokens))
      assert(result.passed, `${exercise.id} reference solution ${solution.id} does not satisfy its outcome`)
    }
  }
}
