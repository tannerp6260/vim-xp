import { describe, expect, it } from 'vitest'
import { parseInlineMarkup } from './inlineMarkup'

describe('inline command markup', () => {
  it('parses prose and multiple semantic code spans', () => {
    expect(parseInlineMarkup('Use `ciw`, then `Escape`.')).toEqual([
      { type: 'text', value: 'Use ' }, { type: 'code', value: 'ciw' },
      { type: 'text', value: ', then ' }, { type: 'code', value: 'Escape' }, { type: 'text', value: '.' },
    ])
  })
  it('rejects unmatched and empty spans', () => {
    expect(() => parseInlineMarkup('Try `ciw')).toThrow(/unmatched/)
    expect(() => parseInlineMarkup('Try `` now')).toThrow(/empty/)
  })
  it('returns plain authored text without raw markup', () => expect(parseInlineMarkup('Plain text')).toEqual([{ type: 'text', value: 'Plain text' }]))
})
