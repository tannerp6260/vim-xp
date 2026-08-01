import type { Exercise } from './model'
import { validateCurriculum } from './validation'

export const initialDocument = `BuildConfig config{
    .environment = "staging",
    .retries = 3,
};
`

export const finalDocument = initialDocument.replace('staging', 'production')

export const changeInsideQuotesExercise: Exercise = {
  id: 'exercise.change-inside-quotes',
  version: '1.0.0',
  title: 'Change inside quotes',
  prompt: 'Change the environment from staging to production. Keep the quotation marks and finish in Normal mode.',
  initial: { document: initialDocument, cursor: initialDocument.indexOf('staging') + 2, language: 'cpp', mode: 'normal' },
  primaryConcepts: ['concept.inner-text-objects'],
  supportingConcepts: ['concept.change-operator', 'concept.normal-mode'],
  outcome: { type: 'all', rules: [{ type: 'exact-document', text: finalDocument }, { type: 'required-mode', mode: 'normal' }] },
  strategies: [
    { id: 'change-inner-quotes', label: 'Change inside quotes', trace: ['c', 'i', '"', ...'production', '<Esc>'], coaching: 'Nicely done. ci" combines the change operator with an inner quote text object, replacing the value while preserving its delimiters.' },
    { id: 'delete-inner-then-insert', label: 'Delete inside quotes, then insert', trace: ['d', 'i', '"', 'i', ...'production', '<Esc>'], coaching: 'Correct. You deleted inside the quotes and inserted the replacement. Another useful option is ci", which combines those steps into one composable change.' },
  ],
  hints: [
    'You don’t need to delete the value one character at a time. Vim can target text inside surrounding delimiters.',
    'Combine the change operator with an inner text object: operator + inner target.',
    'ci" changes the contents inside the nearest quotation marks while preserving the quotes.',
    'Watch a stepped replay of ci"production<Esc>, then reset and reproduce it yourself.',
  ],
  referenceSolutions: [{ id: 'intended', tokens: ['c', 'i', '"', 'production', '<Esc>'] }],
  difficulty: { level: 1, estimatedMinutes: 3 },
}

export const curriculum = validateCurriculum({
  version: '1.0.0',
  concepts: [
    { id: 'concept.inner-text-objects', version: '1.0.0', title: 'Inner text objects', summary: 'Target content inside delimiters.' },
    { id: 'concept.change-operator', version: '1.0.0', title: 'Change operator', summary: 'Delete a target and enter Insert mode.' },
    { id: 'concept.normal-mode', version: '1.0.0', title: 'Normal mode', summary: 'Finish edits ready for another command.' },
  ],
  exercises: [changeInsideQuotesExercise],
})
