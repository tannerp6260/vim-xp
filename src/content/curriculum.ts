import { validateCurriculum } from './validation'
import { exercises as preciseTextObjectExercises, preciseTextObjectConcepts, preciseTextObjectsUnit } from './units/preciseTextObjects'
import { lineTargetingConcepts, lineTargetingExercises, lineTargetingUnit } from './units/lineTargeting'
import type { ExerciseId, UnitId } from './model'

export const curriculum = validateCurriculum({
  version: '3.0.0',
  concepts: [...preciseTextObjectConcepts, ...lineTargetingConcepts],
  exercises: [...preciseTextObjectExercises, ...lineTargetingExercises],
  units: [preciseTextObjectsUnit, lineTargetingUnit],
})

export const getExercise = (id: ExerciseId | string) => curriculum.exercises.find((exercise) => exercise.id === id)
export const getUnit = (id: UnitId | string) => curriculum.units.find((unit) => unit.id === id)
export const unitForExercise = (id: ExerciseId | string) => curriculum.units.find((unit) => unit.exerciseIds.includes(id as ExerciseId))
