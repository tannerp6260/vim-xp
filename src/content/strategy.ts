import type { Exercise, KnownStrategy } from './model'

export function recognizeStrategy(exercise: Exercise, trace: string[], acceptedStrategyIds?: string[]): KnownStrategy | undefined {
  const accepted = acceptedStrategyIds ? new Set(acceptedStrategyIds) : undefined
  return exercise.strategies.find((strategy) => (!accepted || accepted.has(strategy.id)) && strategy.trace.length === trace.length && strategy.trace.every((token, index) => token === trace[index]))
}
