export type ConceptId = `concept.${string}`
export type ExerciseId = `exercise.${string}`
export type UnitId = `unit.${string}`
export type ContentVersion = `${number}.${number}.${number}`
export type VimMode = 'normal' | 'insert' | 'visual'

export type ExactDocumentRule = { type: 'exact-document'; text: string }
export type RequiredModeRule = { type: 'required-mode'; mode: VimMode }
export type CursorAtRule = { type: 'cursor-at'; offset: number }
export type AllRule = { type: 'all'; rules: OutcomeRule[] }
export type OutcomeRule = ExactDocumentRule | RequiredModeRule | CursorAtRule | AllRule

export type Concept = {
  id: ConceptId
  version: ContentVersion
  title: string
  summary: string
}

export type ExerciseInitialState = {
  document: string
  cursor: number
  selection?: { anchor: number; head: number }
  language: 'cpp' | 'cmake' | 'shell'
  mode: 'normal'
}

export type KnownStrategy = {
  id: string
  label: string
  trace: string[]
  coaching: string
}

export type DemonstrationStep = {
  id: string
  tokens: string[]
  display: 'key' | 'literal'
  title: string
  explanation: string
}

export type Demonstration = {
  referenceSolutionId: string
  steps: DemonstrationStep[]
}

export type Exercise = {
  id: ExerciseId
  version: ContentVersion
  variantGroupId: string
  title: string
  prompt: string
  initial: ExerciseInitialState
  primaryConcepts: ConceptId[]
  supportingConcepts: ConceptId[]
  outcome: OutcomeRule
  strategies: KnownStrategy[]
  hints: string[]
  referenceSolutions: { id: string; tokens: string[] }[]
  demonstration: Demonstration
  difficulty: { level: 1 | 2 | 3 | 4 | 5; estimatedMinutes: number }
  friction: 'low' | 'medium' | 'high'
  role: 'introduction' | 'reinforcement' | 'transfer' | 'review'
}

export type CurriculumUnit = {
  id: UnitId
  version: ContentVersion
  order: number
  title: string
  summary: string
  description: string
  conceptIds: ConceptId[]
  exerciseIds: ExerciseId[]
  recommendedPrerequisiteUnitIds: UnitId[]
  prescribedExerciseIds: ExerciseId[]
  completionCopy?: string
}

export type Curriculum = { version: ContentVersion; concepts: Concept[]; exercises: Exercise[]; units: CurriculumUnit[] }
