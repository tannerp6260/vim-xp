import type { Concept, CurriculumUnit, Exercise, ExerciseId } from '../model'

type Definition = {
  id: ExerciseId; variant: string; title: string; prompt: string; language: 'cpp' | 'cmake' | 'shell'
  initial: string; before: string; after: string; command: 'ci"' | 'ciw' | 'di(' | 'ci('
  role: Exercise['role']; friction: Exercise['friction']; level: 1 | 2 | 3
}

function makeExercise(def: Definition): Exercise {
  const cursor = def.initial.indexOf(def.before) + Math.max(0, Math.floor(def.before.length / 2))
  const final = def.initial.replace(def.before, def.after)
  const inserted = def.after
  const tokens = def.command === 'di(' ? ['d', 'i', '('] : [def.command[0], 'i', def.command[2] ?? 'w', inserted, '<Esc>']
  const technique = def.command === 'ci"' ? 'quoted value' : def.command === 'ciw' ? 'word' : 'parenthesized content'
  const targetKey = def.command[2]
  const targetTitle = targetKey === '"' ? 'Target inside double quotes' : targetKey === 'w' ? 'Target the inner word' : 'Target inside parentheses'
  const targetExplanation = targetKey === '"' ? 'Apply the operator to the content inside the nearest double quotes.' : targetKey === 'w' ? 'Apply the operator to the word under the cursor.' : 'Apply the operator to the content inside the nearest parentheses.'
  const demonstration: Exercise['demonstration'] = { referenceSolutionId: 'intended', steps: [
    { id: 'operator', tokens: [def.command[0]], display: 'key', title: def.command[0] === 'd' ? 'Start the delete operator' : 'Start the change operator', explanation: `Press \`${def.command[0]}\`; Vim waits for a target.` },
    { id: 'inner', tokens: ['i'], display: 'key', title: 'Choose the inner form', explanation: 'Press `i` to choose the inner form of a text object.' },
    { id: 'target', tokens: [targetKey], display: 'key', title: targetTitle, explanation: targetExplanation },
    ...(def.command === 'di(' ? [] : [
      { id: 'replacement', tokens: [inserted], display: 'literal' as const, title: 'Type the replacement', explanation: `Insert the literal text \`${inserted}\`.` },
      { id: 'normal-mode', tokens: ['<Esc>'], display: 'key' as const, title: 'Return to Normal mode', explanation: 'Press `Esc` to leave Insert mode and return to Normal mode.' },
    ]),
  ] }
  return {
    id: def.id, version: '1.0.0', variantGroupId: def.variant, title: def.title, prompt: def.prompt,
    initial: { document: def.initial, cursor, language: def.language, mode: 'normal' },
    primaryConcepts: [def.command === 'ciw' ? 'concept.inner-word' : def.command.includes('(') ? 'concept.inner-parentheses' : 'concept.inner-quotes'],
    supportingConcepts: [def.command.startsWith('d') ? 'concept.delete-operator' : 'concept.change-operator', 'concept.normal-mode'],
    outcome: { type: 'all', rules: [{ type: 'exact-document', text: final }, { type: 'required-mode', mode: 'normal' }] },
    strategies: [{ id: def.command, label: def.command, trace: tokens.flatMap((token) => token.length > 1 && !token.startsWith('<') ? [...token] : [token]), coaching: `Nicely done. \`${def.command}\` targets the inner ${technique} while preserving its surrounding structure.` }],
    hints: [
      'Look for the smallest meaningful text object that contains only what should change.',
      `Combine an operator with an inner ${technique} target.`,
      `Use \`${def.command}\` to target the ${technique}.`,
      `Watch a stepped replay of \`${def.command}${def.command === 'di(' ? '' : `${inserted}<Esc>`}\`, then reset and reproduce it.`,
    ],
    referenceSolutions: [{ id: 'intended', tokens }], demonstration, difficulty: { level: def.level, estimatedMinutes: 1 }, friction: def.friction, role: def.role,
  }
}

const definitions: Definition[] = [
  { id: 'exercise.change-inside-quotes', variant: 'quotes-environment', title: 'Change inside quotes', prompt: 'Change the environment from `staging` to `production`. Keep the quotation marks and finish in Normal mode.', language: 'cpp', initial: `BuildConfig config{\n    .environment = "staging",\n    .retries = 3,\n};\n`, before: 'staging', after: 'production', command: 'ci"', role: 'introduction', friction: 'medium', level: 2 },
  { id: 'exercise.quotes-cmake-build-type', variant: 'quotes-build-type', title: 'Switch the build type', prompt: 'Change the CMake build type from `Debug` to `Release` without disturbing the quotes.', language: 'cmake', initial: `set(CMAKE_BUILD_TYPE "Debug")\nadd_executable(app main.cpp)\n`, before: 'Debug', after: 'Release', command: 'ci"', role: 'reinforcement', friction: 'low', level: 1 },
  { id: 'exercise.quotes-shell-base-url', variant: 'quotes-base-url', title: 'Point at production', prompt: 'Update the base URL to `https://api.example.com`, preserving the shell assignment and quotes.', language: 'shell', initial: `BASE_URL="http://localhost:3000"\ncurl "$BASE_URL/health"\n`, before: 'http://localhost:3000', after: 'https://api.example.com', command: 'ci"', role: 'transfer', friction: 'medium', level: 2 },
  { id: 'exercise.word-shell-target', variant: 'word-deploy-target', title: 'Change the deploy target', prompt: 'Change the target value from `staging` to `production` and leave the assignment intact.', language: 'shell', initial: `target=staging\n./deploy "$target"\n`, before: 'staging', after: 'production', command: 'ciw', role: 'introduction', friction: 'low', level: 1 },
  { id: 'exercise.word-cpp-log-level', variant: 'word-log-level', title: 'Reduce log noise', prompt: 'Change the log level from `verbose` to `warning`.', language: 'cpp', initial: `auto log_level = verbose;\nstart_server(log_level);\n`, before: 'verbose', after: 'warning', command: 'ciw', role: 'reinforcement', friction: 'low', level: 1 },
  { id: 'exercise.word-cmake-retry-policy', variant: 'word-retry-policy', title: 'Back off retries', prompt: 'Change the retry policy from `immediate` to `exponential`.', language: 'cmake', initial: `set(RETRY_POLICY immediate)\nset(RETRY_LIMIT 5)\n`, before: 'immediate', after: 'exponential', command: 'ciw', role: 'review', friction: 'low', level: 1 },
  { id: 'exercise.parens-clear-cache-args', variant: 'parens-clear-args', title: 'Clear the cache arguments', prompt: 'Remove both arguments from the invalidate call while keeping the parentheses and semicolon.', language: 'cpp', initial: `cache.invalidate(user_id, region);\nrefresh_view();\n`, before: 'user_id, region', after: '', command: 'di(', role: 'introduction', friction: 'medium', level: 2 },
  { id: 'exercise.parens-connect', variant: 'parens-connect', title: 'Change connection arguments', prompt: 'Update the call so it connects to `replica` with `5` retries. Preserve the call structure.', language: 'cpp', initial: `connect(primary, 3);\nawait_ready();\n`, before: 'primary, 3', after: 'replica, 5', command: 'ci(', role: 'transfer', friction: 'high', level: 3 },
  { id: 'exercise.parens-run-checks', variant: 'parens-run-checks', title: 'Narrow the check suite', prompt: 'Change the call to run only the `smoke` checks. Preserve the function name and delimiters.', language: 'cmake', initial: `run_checks(unit integration)\nreport_results()\n`, before: 'unit integration', after: 'smoke', command: 'ci(', role: 'transfer', friction: 'medium', level: 2 },
]

export const exercises = definitions.map(makeExercise)
export const changeInsideQuotesExercise = exercises[0]
changeInsideQuotesExercise.strategies = [
  { ...changeInsideQuotesExercise.strategies[0], id: 'change-inner-quotes' },
  { id: 'delete-inner-then-insert', label: 'Delete inside quotes, then insert', trace: ['d', 'i', '"', 'i', ...'production', '<Esc>'], coaching: 'Correct. You deleted inside the quotes and inserted the replacement. Another useful option is `ci"`, which combines those steps.' },
]
export const initialDocument = changeInsideQuotesExercise.initial.document
export const finalDocument = initialDocument.replace('staging', 'production')
export const firstSessionExerciseIds: ExerciseId[] = [exercises[0], exercises[1], exercises[3], exercises[2], exercises[6], exercises[4], exercises[8]].map((exercise) => exercise.id)

export const preciseTextObjectConcepts: Concept[] = [
    { id: 'concept.inner-quotes', version: '1.0.0', title: 'Inside quotes', summary: 'Target content inside quotes.' },
    { id: 'concept.inner-word', version: '1.0.0', title: 'Inner word', summary: 'Target the word under the cursor.' },
    { id: 'concept.inner-parentheses', version: '1.0.0', title: 'Inside parentheses', summary: 'Target call arguments inside parentheses.' },
    { id: 'concept.change-operator', version: '1.0.0', title: 'Change operator', summary: 'Replace a target and enter Insert mode.' },
    { id: 'concept.delete-operator', version: '1.0.0', title: 'Delete operator', summary: 'Remove a target.' },
    { id: 'concept.normal-mode', version: '1.0.0', title: 'Normal mode', summary: 'Finish ready for another command.' },
  ]

export const preciseTextObjectsUnit: CurriculumUnit = {
  id: 'unit.precise-text-objects', version: '1.0.0', order: 1,
  title: 'Precise text objects', summary: 'Target meaningful text precisely with operators and inner text objects.',
  description: 'Practice changing quoted values and words, then editing the content inside parentheses across realistic files.',
  conceptIds: preciseTextObjectConcepts.map((concept) => concept.id), exerciseIds: exercises.map((exercise) => exercise.id),
  recommendedPrerequisiteUnitIds: [], prescribedExerciseIds: firstSessionExerciseIds,
  completionCopy: 'Seven precise edits, done.',
}
