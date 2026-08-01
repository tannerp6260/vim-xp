export const specialKeys: Record<string, string> = { Escape: '<Esc>', Enter: '<Enter>', Backspace: '<BS>', Tab: '<Tab>', ArrowUp: '<Up>', ArrowDown: '<Down>', ArrowLeft: '<Left>', ArrowRight: '<Right>' }
const modifierOnlyKeys = new Set(['Control', 'Shift', 'Alt', 'Meta'])

export function normalizeKeyboardEvent(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>): string | null {
  if (modifierOnlyKeys.has(event.key)) return null
  if (event.metaKey) return null
  const key = specialKeys[event.key] ?? (event.key.length === 1 ? event.key : `<${event.key}>`)
  if (event.ctrlKey) return `<C-${event.key.toLowerCase()}>`
  if (event.altKey) return `<A-${event.key}>`
  return key
}

export function expandReplayToken(token: string): string[] {
  if (token.startsWith('<') || token.length <= 1) return [token]
  return [...token]
}
