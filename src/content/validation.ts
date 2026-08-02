import type { Curriculum, Exercise, OutcomeRule } from './model'
import { evaluateOutcome } from './evaluator'
import { validateInlineMarkup } from './inlineMarkup'

export class ContentValidationError extends Error {}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContentValidationError(message)
}

function validateRule(rule: OutcomeRule, context: string): void {
  assert(rule && typeof rule === 'object' && 'type' in rule, `${context} has an invalid outcome rule`)
  if (rule.type === 'exact-document') return assert(typeof rule.text === 'string', `${context} exact-document rule requires text`)
  if (rule.type === 'required-mode') return assert(['normal', 'insert', 'visual'].includes(rule.mode), `${context} required-mode rule has an invalid mode`)
  if (rule.type === 'cursor-at') return assert(Number.isInteger(rule.offset) && rule.offset >= 0, `${context} cursor-at rule requires a nonnegative integer offset`)
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
  const ids = [...curriculum.concepts.map((item) => item.id), ...curriculum.exercises.map((item) => item.id), ...curriculum.units.map((item) => item.id)]
  assert(new Set(ids).size === ids.length, 'Curriculum IDs must be unique')
  const conceptIds = new Set(curriculum.concepts.map((concept) => concept.id))
  curriculum.exercises.forEach((exercise) => {
    assert(exercise.prompt.trim(), `${exercise.id} has an empty prompt`)
    assert(exercise.variantGroupId.trim(), `${exercise.id} has no variant group`)
    assert(exercise.hints.length === 4 && exercise.hints.every((hint) => hint.trim()), `${exercise.id} must have a four-step hint ladder`)
    ;[exercise.title, exercise.prompt, ...exercise.hints, ...exercise.strategies.map((strategy) => strategy.coaching)].forEach(validateInlineMarkup)
    validatePosition(exercise.initial.cursor, exercise.initial.document, `${exercise.id} cursor`)
    if (exercise.initial.selection) {
      validatePosition(exercise.initial.selection.anchor, exercise.initial.document, `${exercise.id} selection anchor`)
      validatePosition(exercise.initial.selection.head, exercise.initial.document, `${exercise.id} selection head`)
    }
    ;[...exercise.primaryConcepts, ...exercise.supportingConcepts].forEach((id) => assert(conceptIds.has(id), `${exercise.id} references unknown concept ${id}`))
    validateRule(exercise.outcome, exercise.id)
    const cursorRules = exercise.outcome.type === 'all' ? exercise.outcome.rules.filter((rule) => rule.type === 'cursor-at') : exercise.outcome.type === 'cursor-at' ? [exercise.outcome] : []
    cursorRules.forEach((rule) => assert(rule.offset < exercise.initial.document.length || (rule.offset === 0 && exercise.initial.document.length === 0), `${exercise.id} cursor outcome is outside its declared document`))
    assert(exercise.referenceSolutions.length > 0 && exercise.referenceSolutions.every((solution) => solution.tokens.length > 0), `${exercise.id} has an empty reference solution`)
    const steps = exercise.demonstration?.steps
    assert(Array.isArray(steps) && steps.length > 0, `${exercise.id} must have a demonstration`)
    assert(steps.every((step) => /^[a-z][a-z0-9-]*$/.test(step.id)), `${exercise.id} has an invalid demonstration step ID`)
    assert(new Set(steps.map((step) => step.id)).size === steps.length, `${exercise.id} has duplicate demonstration step IDs`)
    assert(steps.every((step) => step.tokens.length > 0 && step.tokens.every((token) => token.length > 0) && step.title.trim() && step.explanation.trim()), `${exercise.id} has an incomplete demonstration step`)
    const reference = exercise.referenceSolutions.find((solution) => solution.id === exercise.demonstration.referenceSolutionId)
    assert(reference, `${exercise.id} demonstration references an unknown solution`)
    assert(steps.flatMap((step) => step.tokens).join('\u0000') === reference.tokens.join('\u0000'), `${exercise.id} demonstration tokens differ from its reference solution`)
    steps.forEach((step) => { validateInlineMarkup(step.title); validateInlineMarkup(step.explanation) })
  })
  const exerciseIds = new Set(curriculum.exercises.map((exercise) => exercise.id))
  const unitIds = new Set(curriculum.units.map((unit) => unit.id))
  assert(curriculum.units.length > 0, 'Curriculum must contain units')
  assert(new Set(curriculum.units.map((unit) => unit.order)).size === curriculum.units.length, 'Unit order values must be unique')
  const membership = new Map<string, string>()
  curriculum.units.forEach((unit) => {
    assert(unit.title.trim() && unit.summary.trim() && unit.description.trim(), `${unit.id} has incomplete learner-facing copy`)
    assert(unit.exerciseIds.length > 0, `${unit.id} is empty`)
    assert(new Set(unit.exerciseIds).size === unit.exerciseIds.length, `${unit.id} contains duplicate exercise IDs`)
    assert(new Set(unit.prescribedExerciseIds).size === unit.prescribedExerciseIds.length, `${unit.id} contains duplicate prescribed exercise IDs`)
    unit.exerciseIds.forEach((id) => { assert(exerciseIds.has(id), `${unit.id} references unknown exercise ${id}`); assert(!membership.has(id), `${id} belongs to more than one unit`); membership.set(id, unit.id) })
    unit.conceptIds.forEach((id) => assert(conceptIds.has(id), `${unit.id} references unknown concept ${id}`))
    unit.recommendedPrerequisiteUnitIds.forEach((id) => assert(unitIds.has(id), `${unit.id} references unknown prerequisite unit ${id}`))
    unit.prescribedExerciseIds.forEach((id) => assert(unit.exerciseIds.includes(id), `${unit.id} prescribed exercise ${id} is not a member`))
  })
  curriculum.exercises.forEach((exercise) => assert(membership.has(exercise.id), `${exercise.id} is orphaned from curriculum units`))
  const visiting = new Set<string>(); const visited = new Set<string>()
  const visit = (id: string) => { if (visiting.has(id)) throw new ContentValidationError('Unit prerequisite relationships contain a cycle'); if (visited.has(id)) return; visiting.add(id); curriculum.units.find((unit) => unit.id === id)!.recommendedPrerequisiteUnitIds.forEach(visit); visiting.delete(id); visited.add(id) }
  curriculum.units.forEach((unit) => visit(unit.id))
  return curriculum
}

export type ReferenceReplay = (exercise: Exercise, tokens: string[]) => Promise<{ document: string; mode: string; cursor?: number }>

export async function validateReferenceSolutions(curriculum: Curriculum, replay: ReferenceReplay): Promise<void> {
  for (const exercise of curriculum.exercises) {
    for (const solution of exercise.referenceSolutions) {
      const result = evaluateOutcome(exercise.outcome, await replay(exercise, solution.tokens))
      assert(result.passed, `${exercise.id} reference solution ${solution.id} does not satisfy its outcome`)
    }
  }
}
