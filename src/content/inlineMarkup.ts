export type InlineSegment = { type: 'text' | 'code'; value: string }

export function parseInlineMarkup(value: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let code = false
  let start = 0
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '`') continue
    const content = value.slice(start, index)
    if (code && !content) throw new Error('Inline code spans cannot be empty')
    if (content) segments.push({ type: code ? 'code' : 'text', value: content })
    code = !code
    start = index + 1
  }
  if (code) throw new Error('Inline code span has an unmatched backtick')
  const tail = value.slice(start)
  if (tail) segments.push({ type: 'text', value: tail })
  return segments
}

export function validateInlineMarkup(value: string): void { parseInlineMarkup(value) }
