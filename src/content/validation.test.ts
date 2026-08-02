import { describe, expect, it } from 'vitest'
import type { Curriculum } from './model'
import { curriculum } from './firstExercise'
import { ContentValidationError, validateCurriculum, validateReferenceSolutions } from './validation'

const copy = () => structuredClone(curriculum) as Curriculum

describe('content validation', () => {
  it('accepts all nine complete exercise definitions', () => {
    const content = validateCurriculum(copy())
    expect(content.exercises).toHaveLength(9)
    for (const exercise of content.exercises) {
      expect(exercise.hints).toHaveLength(4)
      expect(exercise.primaryConcepts.length).toBeGreaterThan(0)
      expect(exercise.supportingConcepts.length).toBeGreaterThan(0)
      expect(exercise.referenceSolutions.length).toBeGreaterThan(0)
      expect(exercise.outcome.type).toBe('all')
      expect(['introduction', 'reinforcement', 'transfer', 'review']).toContain(exercise.role)
    }
  })

  it('rejects duplicate IDs', () => {
    const content = copy(); content.exercises.push(structuredClone(content.exercises[0]))
    expect(() => validateCurriculum(content)).toThrow(ContentValidationError)
  })

  it('rejects unknown concepts', () => {
    const content = copy(); content.exercises[0].primaryConcepts = ['concept.missing']
    expect(() => validateCurriculum(content)).toThrow(/unknown concept/)
  })

  it.each([
    ['cursor', (content: Curriculum) => { content.exercises[0].initial.cursor = -1 }],
    ['selection', (content: Curriculum) => { content.exercises[0].initial.selection = { anchor: 0, head: 9999 } }],
    ['prompt', (content: Curriculum) => { content.exercises[0].prompt = ' ' }],
    ['hints', (content: Curriculum) => { content.exercises[0].hints = [] }],
    ['references', (content: Curriculum) => { content.exercises[0].referenceSolutions = [{ id: 'empty', tokens: [] }] }],
  ])('rejects invalid %s content', (_label, mutate) => {
    const content = copy(); mutate(content)
    expect(() => validateCurriculum(content)).toThrow(ContentValidationError)
  })

  it('rejects unsupported outcome rules', () => {
    const content = copy(); content.exercises[0].outcome = { type: 'future-rule' } as never
    expect(() => validateCurriculum(content)).toThrow(/unsupported outcome-rule/)
  })

  it('rejects reference solutions whose replayed state misses the outcome', async () => {
    await expect(validateReferenceSolutions(copy(), async () => ({ document: 'wrong', mode: 'normal' }))).rejects.toThrow(/does not satisfy/)
  })

  it('declares di( as complete in Normal mode without Escape', () => {
    const exercise = curriculum.exercises.find((item) => item.id === 'exercise.parens-clear-cache-args')!
    expect(exercise.referenceSolutions[0].tokens).toEqual(['d', 'i', '('])
    expect(exercise.strategies[0].trace).toEqual(['d', 'i', '('])
    expect(exercise.hints[3]).toContain('`di(`')
    expect(exercise.hints[3]).not.toContain('Escape')
  })

  it('uses language-appropriate syntax for every fixture', () => {
    const cmake = curriculum.exercises.filter((item) => item.initial.language === 'cmake')
    expect(cmake.find((item) => item.id === 'exercise.parens-run-checks')!.initial.document).toBe('run_checks(unit integration)\nreport_results()\n')
    expect(cmake.every((item) => !item.initial.document.includes(';'))).toBe(true)
  })
})
