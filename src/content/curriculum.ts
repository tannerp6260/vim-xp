import { validateCurriculum } from './validation'
import { exercises as preciseTextObjectExercises, preciseTextObjectConcepts, preciseTextObjectsUnit } from './units/preciseTextObjects'
import { lineTargetingConcepts, lineTargetingExercises, lineTargetingUnit } from './units/lineTargeting'
import type { ExerciseId, UnitId } from './model'

export const curriculum = validateCurriculum({
  version: '4.0.0',
  concepts: [...preciseTextObjectConcepts, ...lineTargetingConcepts],
  exercises: [...preciseTextObjectExercises, ...lineTargetingExercises],
  units: [preciseTextObjectsUnit, lineTargetingUnit],
  placementGates: [
    { id: 'gate.precise-quotes', unitId: 'unit.precise-text-objects', exerciseId: 'exercise.quotes-shell-base-url', conceptIds: ['concept.inner-quotes'], acceptedStrategyIds: ['ci"'], role: 'required', priority: 1, requiredToSkipIntroduction: true },
    { id: 'gate.line-movement', unitId: 'unit.line-targeting', exerciseId: 'exercise.line-till-cpp-close-paren', conceptIds: ['concept.till-forward'], acceptedStrategyIds: ['intended'], role: 'required', priority: 2, requiredToSkipIntroduction: true },
    { id: 'gate.precise-parens', unitId: 'unit.precise-text-objects', exerciseId: 'exercise.parens-clear-cache-args', conceptIds: ['concept.inner-parentheses'], acceptedStrategyIds: ['di('], role: 'required', priority: 3, requiredToSkipIntroduction: true },
    { id: 'gate.line-repeat-reverse', unitId: 'unit.line-targeting', exerciseId: 'exercise.line-reverse-shell-colon', conceptIds: ['concept.find-forward', 'concept.repeat-character-search', 'concept.reverse-character-search'], acceptedStrategyIds: ['intended'], role: 'required', priority: 4, requiredToSkipIntroduction: true },
    { id: 'gate.line-operator', unitId: 'unit.line-targeting', exerciseId: 'exercise.line-change-cmake-argument', conceptIds: ['concept.operator-character-motion', 'concept.till-forward'], acceptedStrategyIds: ['intended'], role: 'required', priority: 5, requiredToSkipIntroduction: true },
    { id: 'gate.precise-confirmation', unitId: 'unit.precise-text-objects', exerciseId: 'exercise.word-cmake-retry-policy', conceptIds: ['concept.inner-word'], acceptedStrategyIds: ['ciw'], role: 'confirmation', priority: 6, requiredToSkipIntroduction: false },
  ],
})

export const getExercise = (id: ExerciseId | string) => curriculum.exercises.find((exercise) => exercise.id === id)
export const getUnit = (id: UnitId | string) => curriculum.units.find((unit) => unit.id === id)
export const unitForExercise = (id: ExerciseId | string) => curriculum.units.find((unit) => unit.exerciseIds.includes(id as ExerciseId))
