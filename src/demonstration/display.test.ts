import { describe, expect, it } from 'vitest'
import { demonstrationTokenLabel } from './display'

describe('demonstration key labels', () => {
  it('names invisible and special keys', () => { expect(demonstrationTokenLabel(' ')).toBe('Space'); expect(demonstrationTokenLabel('<Esc>')).toBe('Esc'); expect(demonstrationTokenLabel(',')).toBe(',') })
})
