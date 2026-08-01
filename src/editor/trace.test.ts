import { describe, expect, it } from 'vitest'
import { expandReplayToken, normalizeKeyboardEvent } from './trace'

describe('input normalization', () => {
  it('normalizes ordinary, special, and control keys', () => {
    expect(normalizeKeyboardEvent({ key: 'w', ctrlKey: false, altKey: false, metaKey: false })).toBe('w')
    expect(normalizeKeyboardEvent({ key: 'Escape', ctrlKey: false, altKey: false, metaKey: false })).toBe('<Esc>')
    expect(normalizeKeyboardEvent({ key: 'r', ctrlKey: true, altKey: false, metaKey: false })).toBe('<C-r>')
  })
  it.each([
    ['Control', true, false, false],
    ['Shift', false, false, false],
    ['Alt', false, true, false],
    ['Meta', false, false, true],
  ] as const)('does not normalize the modifier-only %s keydown', (key, ctrlKey, altKey, metaKey) => {
    expect(normalizeKeyboardEvent({ key, ctrlKey, altKey, metaKey })).toBeNull()
  })
  it('emits one semantic token per sequential control chord', () => {
    const events = [
      { key: 'Control', ctrlKey: true, altKey: false, metaKey: false },
      { key: 'r', ctrlKey: true, altKey: false, metaKey: false },
      { key: 'Control', ctrlKey: true, altKey: false, metaKey: false },
      { key: 'a', ctrlKey: true, altKey: false, metaKey: false },
      { key: 'Control', ctrlKey: true, altKey: false, metaKey: false },
      { key: 'f', ctrlKey: true, altKey: false, metaKey: false },
    ]
    expect(events.map(normalizeKeyboardEvent).filter(Boolean)).toEqual(['<C-r>', '<C-a>', '<C-f>'])
  })
  it('does not record browser/OS meta shortcuts', () => expect(normalizeKeyboardEvent({ key: 'l', ctrlKey: false, altKey: false, metaKey: true })).toBeNull())
  it('expands literal replay text but preserves named tokens', () => {
    expect(expandReplayToken('word')).toEqual(['w', 'o', 'r', 'd'])
    expect(expandReplayToken('<Esc>')).toEqual(['<Esc>'])
  })
})
