export type ConceptId = `concept.${string}`
export type ExerciseId = `exercise.${string}`
export type ContentVersion = `${number}.${number}.${number}`
export type VimMode = 'normal' | 'insert' | 'visual'

export type ExactDocumentRule = { type: 'exact-document'; text: string }
export type RequiredModeRule = { type: 'required-mode'; mode: VimMode }
export type AllRule = { type: 'all'; rules: OutcomeRule[] }
export type OutcomeRule = ExactDocumentRule | RequiredModeRule | AllRule

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

export type Exercise = {
  id: ExerciseId
  version: ContentVersion
  title: string
  prompt: string
  initial: ExerciseInitialState
  primaryConcepts: ConceptId[]
  supportingConcepts: ConceptId[]
  outcome: OutcomeRule
  strategies: KnownStrategy[]
  hints: string[]
  referenceSolutions: { id: string; tokens: string[] }[]
  difficulty: { level: 1 | 2 | 3 | 4 | 5; estimatedMinutes: number }
}

export type Curriculum = { version: ContentVersion; concepts: Concept[]; exercises: Exercise[] }
