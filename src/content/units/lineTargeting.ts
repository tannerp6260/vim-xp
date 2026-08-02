import type { Concept, CurriculumUnit, DemonstrationStep, Exercise, ExerciseId } from '../model'

type Definition = {
  id: ExerciseId
  variant: string
  title: string
  prompt: string
  language: Exercise['initial']['language']
  initial: string
  cursorAt: string
  cursorDelta?: number
  tokens: string[]
  final: string
  finalCursor: number
  primary: Exercise['primaryConcepts'][number]
  supporting: Exercise['supportingConcepts']
  role: Exercise['role']
  friction: Exercise['friction']
  level: 1 | 2 | 3
  hints: [string, string, string, string]
  steps: DemonstrationStep[]
}

const keyStep = (id: string, token: string, title: string, explanation: string): DemonstrationStep => ({ id, tokens: [token], display: 'key', title, explanation })
const literalStep = (text: string): DemonstrationStep => ({ id: 'replacement', tokens: [text], display: 'literal', title: 'Type the replacement', explanation: `Insert the literal text \`${text}\`.` })
const normalStep = (): DemonstrationStep => keyStep('normal-mode', '<Esc>', 'Return to Normal mode', 'Press `Esc` to leave Insert mode and return to Normal mode.')
const findSteps = (target: string): DemonstrationStep[] => [
  keyStep('find', 'f', 'Find forward on this line', 'Press `f`; Vim waits for the character to find.'),
  keyStep('target', target, `Find ${target === ' ' ? 'Space' : `\`${target}\``}`, `Press \`${target === ' ' ? 'Space' : target}\` to land on that character.`),
]
const tillSteps = (target: string): DemonstrationStep[] => [
  keyStep('till', 't', 'Move until a character', 'Press `t`; Vim waits for the boundary character.'),
  keyStep('target', target, `Stop before \`${target}\``, `Press \`${target}\` to stop immediately before it.`),
]
const repeatStep = (): DemonstrationStep => keyStep('repeat', ';', 'Repeat the latest search', 'Press `;` to repeat the most recent `f` or `t` search in the same direction.')
const reverseStep = (): DemonstrationStep => keyStep('reverse', ',', 'Repeat in the opposite direction', 'Press `,` to repeat the most recent character search in the opposite direction.')
const changeSteps = (target: string, replacement: string): DemonstrationStep[] => [
  keyStep('operator', 'c', 'Start the change operator', 'Press `c`; Vim waits for a motion that defines what to replace.'),
  ...tillSteps(target), literalStep(replacement), normalStep(),
]

function makeExercise(def: Definition): Exercise {
  const cursor = def.initial.indexOf(def.cursorAt) + (def.cursorDelta ?? 0)
  return {
    id: def.id, version: '1.0.0', variantGroupId: def.variant, title: def.title, prompt: def.prompt,
    initial: { document: def.initial, cursor, language: def.language, mode: 'normal' },
    primaryConcepts: [def.primary], supportingConcepts: def.supporting,
    outcome: { type: 'all', rules: [{ type: 'exact-document', text: def.final }, { type: 'cursor-at', offset: def.finalCursor }, { type: 'required-mode', mode: 'normal' }] },
    strategies: [{ id: 'intended', label: def.tokens.join(''), trace: def.tokens.flatMap((token) => token.startsWith('<') ? [token] : [...token]), coaching: `Correct. \`${def.tokens.join('').replace('<Esc>', '<Esc>')}\` reached the requested outcome while preserving the surrounding line.` }],
    hints: def.hints, referenceSolutions: [{ id: 'intended', tokens: def.tokens }],
    demonstration: { referenceSolutionId: 'intended', steps: def.steps },
    difficulty: { level: def.level, estimatedMinutes: 1 }, friction: def.friction, role: def.role,
  }
}

const cppAssign = 'auto retry_limit = 3;\nstart_worker(retry_limit);\n'
const cmakeCall = 'add_executable(worker main.cpp)\ntarget_compile_features(worker PRIVATE cxx_std_20)\n'
const shellMode = 'MODE="release"\n./package --mode "$MODE"\n'
const cppResponse = 'send_response(status_code);\nflush_output();\n'
const shellPath = 'PATH="/usr/local/bin:/usr/bin:/bin"\nexport PATH\n'
const cppArgs = 'render(scene, camera, viewport);\npresent_frame();\n'
const shellPlugins = 'PLUGIN_PATH="/opt/plugins/core:/opt/plugins/team:/opt/plugins/local"\nexport PLUGIN_PATH\n'
const cppConnect = 'connect(primary, retries);\nawait_ready();\n'
const cmakeRetry = 'set(RETRY_POLICY immediate)\nconfigure_retries(${RETRY_POLICY})\n'
const shellCommand = 'MODE=staging; deploy "$MODE"\n'
const shellFiles = 'ARTIFACTS="debug.log release.log"\nupload $ARTIFACTS\n'

const navHints = (concept: string, command: string): [string, string, string, string] => [
  `Look for a character on the current line that can serve as a precise destination.`,
  concept,
  `Use \`${command}\` from the current cursor position.`,
  `Watch a stepped replay of \`${command}\`, then reset and reproduce it.`,
]
const editHints = (motion: string, command: string): [string, string, string, string] => [
  'Use the punctuation after the target as a boundary so the surrounding syntax stays intact.',
  `Compose the change or delete operator with a character-search motion such as \`${motion}\`.`,
  `Use \`${command}\` for this edit.`,
  `Watch a stepped replay of \`${command}\`, then reset and reproduce it.`,
]

const definitions: Definition[] = [
  { id: 'exercise.line-find-assignment', variant: 'line-find-assignment', title: 'Land on the assignment', prompt: 'Move the cursor directly onto the assignment operator. Do not change the document.', language: 'cpp', initial: cppAssign, cursorAt: 'auto', tokens: ['f', '='], final: cppAssign, finalCursor: cppAssign.indexOf('='), primary: 'concept.find-forward', supporting: ['concept.normal-mode'], role: 'introduction', friction: 'low', level: 1, hints: navHints('Use a forward find that lands on its target character.', 'f='), steps: findSteps('=') },
  { id: 'exercise.line-find-cmake-paren', variant: 'line-find-cmake-paren', title: 'Find the argument list', prompt: 'Move directly onto the opening parenthesis of the first CMake command without changing text.', language: 'cmake', initial: cmakeCall, cursorAt: 'add_', tokens: ['f', '('], final: cmakeCall, finalCursor: cmakeCall.indexOf('('), primary: 'concept.find-forward', supporting: ['concept.normal-mode'], role: 'reinforcement', friction: 'low', level: 1, hints: navHints('Use the forward character-find motion.', 'f('), steps: findSteps('(') },
  { id: 'exercise.line-till-shell-quote', variant: 'line-till-shell-quote', title: 'Stop inside the quoted value', prompt: 'From inside the value, move to the final character of `release`, immediately before the closing quote. Keep the line unchanged.', language: 'shell', initial: shellMode, cursorAt: 'release', tokens: ['t', '"'], final: shellMode, finalCursor: shellMode.indexOf('"', shellMode.indexOf('"') + 1) - 1, primary: 'concept.till-forward', supporting: ['concept.normal-mode'], role: 'introduction', friction: 'low', level: 1, hints: navHints('Use a forward motion that stops one character before its target.', 't"'), steps: tillSteps('"') },
  { id: 'exercise.line-till-cpp-close-paren', variant: 'line-till-cpp-paren', title: 'Reach the end of the argument', prompt: 'Move to the final character inside `send_response(...)` without changing the call.', language: 'cpp', initial: cppResponse, cursorAt: 'send_', tokens: ['t', ')'], final: cppResponse, finalCursor: cppResponse.indexOf(')') - 1, primary: 'concept.till-forward', supporting: ['concept.normal-mode'], role: 'reinforcement', friction: 'low', level: 1, hints: navHints('Stop immediately before the closing parenthesis.', 't)'), steps: tillSteps(')') },
  { id: 'exercise.line-repeat-path-colon', variant: 'line-repeat-path-colon', title: 'Reach the second PATH separator', prompt: 'Move to the second colon in the `PATH` value. Leave the assignment unchanged.', language: 'shell', initial: shellPath, cursorAt: '/usr', tokens: ['f', ':', ';'], final: shellPath, finalCursor: shellPath.indexOf(':', shellPath.indexOf(':') + 1), primary: 'concept.repeat-character-search', supporting: ['concept.find-forward', 'concept.normal-mode'], role: 'introduction', friction: 'medium', level: 2, hints: navHints('Find the first colon, then repeat the same character search.', 'f:;'), steps: [...findSteps(':'), repeatStep()] },
  { id: 'exercise.line-repeat-cpp-comma', variant: 'line-repeat-cpp-comma', title: 'Reach the second argument separator', prompt: 'Move to the second comma in the render call without altering the arguments.', language: 'cpp', initial: cppArgs, cursorAt: 'render', tokens: ['f', ',', ';'], final: cppArgs, finalCursor: cppArgs.indexOf(',', cppArgs.indexOf(',') + 1), primary: 'concept.repeat-character-search', supporting: ['concept.find-forward', 'concept.normal-mode'], role: 'reinforcement', friction: 'medium', level: 2, hints: navHints('Find one comma, then repeat that search in the same direction.', 'f,;'), steps: [...findSteps(','), repeatStep()] },
  { id: 'exercise.line-reverse-cpp-comma', variant: 'line-reverse-cpp-comma', title: 'Return to the previous separator', prompt: 'Reach the second comma, then return to the first comma by reversing the latest character search.', language: 'cpp', initial: cppArgs, cursorAt: 'render', tokens: ['f', ',', ';', ','], final: cppArgs, finalCursor: cppArgs.indexOf(','), primary: 'concept.reverse-character-search', supporting: ['concept.find-forward', 'concept.repeat-character-search', 'concept.normal-mode'], role: 'introduction', friction: 'medium', level: 2, hints: navHints('After repeating forward, repeat the latest search once in the opposite direction.', 'f,;,'), steps: [...findSteps(','), repeatStep(), reverseStep()] },
  { id: 'exercise.line-reverse-shell-colon', variant: 'line-reverse-shell-colon', title: 'Return through the plugin path', prompt: 'Reach the second colon in `PLUGIN_PATH`, then return to the first using the opposite repeat direction.', language: 'shell', initial: shellPlugins, cursorAt: '/opt', tokens: ['f', ':', ';', ','], final: shellPlugins, finalCursor: shellPlugins.indexOf(':'), primary: 'concept.reverse-character-search', supporting: ['concept.find-forward', 'concept.repeat-character-search', 'concept.normal-mode'], role: 'transfer', friction: 'medium', level: 2, hints: navHints('Establish a colon search, repeat it, then reverse that search.', 'f:;,'), steps: [...findSteps(':'), repeatStep(), reverseStep()] },
  { id: 'exercise.line-change-first-argument', variant: 'line-change-first-argument', title: 'Switch the connection target', prompt: 'Replace the first argument with `replica` while preserving the comma, retry argument, and call structure.', language: 'cpp', initial: cppConnect, cursorAt: 'primary', tokens: ['c', 't', ',', 'replica', '<Esc>'], final: cppConnect.replace('primary', 'replica'), finalCursor: cppConnect.replace('primary', 'replica').indexOf('replica') + 'replica'.length - 1, primary: 'concept.operator-character-motion', supporting: ['concept.till-forward', 'concept.change-operator', 'concept.normal-mode'], role: 'introduction', friction: 'medium', level: 2, hints: editHints('t,', 'ct,replica<Esc>'), steps: changeSteps(',', 'replica') },
  { id: 'exercise.line-change-cmake-argument', variant: 'line-change-cmake-argument', title: 'Change the retry policy', prompt: 'Replace the remaining policy argument with `exponential` while preserving the closing parenthesis.', language: 'cmake', initial: cmakeRetry, cursorAt: 'immediate', tokens: ['c', 't', ')', 'exponential', '<Esc>'], final: cmakeRetry.replace('immediate', 'exponential'), finalCursor: cmakeRetry.replace('immediate', 'exponential').indexOf('exponential') + 'exponential'.length - 1, primary: 'concept.operator-character-motion', supporting: ['concept.till-forward', 'concept.change-operator', 'concept.normal-mode'], role: 'transfer', friction: 'medium', level: 2, hints: editHints('t)', 'ct)exponential<Esc>'), steps: changeSteps(')', 'exponential') },
  { id: 'exercise.line-change-shell-semicolon', variant: 'line-change-shell-semicolon', title: 'Change one chained value', prompt: 'Change the mode to `production` while preserving the semicolon and following deploy command.', language: 'shell', initial: shellCommand, cursorAt: 'staging', tokens: ['c', 't', ';', 'production', '<Esc>'], final: shellCommand.replace('staging', 'production'), finalCursor: shellCommand.replace('staging', 'production').indexOf('production') + 'production'.length - 1, primary: 'concept.operator-character-motion', supporting: ['concept.till-forward', 'concept.change-operator', 'concept.normal-mode'], role: 'transfer', friction: 'high', level: 3, hints: editHints('t;', 'ct;production<Esc>'), steps: changeSteps(';', 'production') },
  { id: 'exercise.line-delete-artifact', variant: 'line-delete-artifact', title: 'Remove the debug artifact', prompt: 'Remove `debug.log` and its trailing space so only `release.log` remains in the quoted list.', language: 'shell', initial: shellFiles, cursorAt: 'debug.log', tokens: ['d', 'f', ' '], final: shellFiles.replace('debug.log ', ''), finalCursor: shellFiles.replace('debug.log ', '').indexOf('release.log'), primary: 'concept.operator-character-motion', supporting: ['concept.find-forward', 'concept.delete-operator', 'concept.normal-mode'], role: 'transfer', friction: 'medium', level: 2, hints: editHints('f Space', 'df '), steps: [keyStep('operator', 'd', 'Start the delete operator', 'Press `d`; Vim waits for a motion that defines what to remove.'), ...findSteps(' ')] },
]

export const lineTargetingExercises = definitions.map(makeExercise)
export const lineTargetingConcepts: Concept[] = [
  { id: 'concept.find-forward', version: '1.0.0', title: 'Find forward', summary: 'Land on a chosen character later on the current line.' },
  { id: 'concept.till-forward', version: '1.0.0', title: 'Stop before a character', summary: 'Move forward to the character immediately before a chosen boundary.' },
  { id: 'concept.repeat-character-search', version: '1.0.0', title: 'Repeat a character search', summary: 'Repeat the latest line-local character search in the same direction.' },
  { id: 'concept.reverse-character-search', version: '1.0.0', title: 'Reverse a character search', summary: 'Repeat the latest line-local character search in the opposite direction.' },
  { id: 'concept.operator-character-motion', version: '1.0.0', title: 'Compose with a character motion', summary: 'Use a line-local character search as the target of change or delete.' },
]

export const lineTargetingFirstSessionExerciseIds: ExerciseId[] = [
  'exercise.line-find-assignment', 'exercise.line-till-shell-quote', 'exercise.line-find-cmake-paren',
  'exercise.line-repeat-path-colon', 'exercise.line-change-first-argument', 'exercise.line-reverse-cpp-comma',
  'exercise.line-change-shell-semicolon',
]

export const lineTargetingUnit: CurriculumUnit = {
  id: 'unit.line-targeting', version: '1.0.0', order: 2, title: 'Target within a line',
  summary: 'Move to meaningful punctuation and compose line-local searches with operators.',
  description: 'Learn to find or stop before a character, repeat and reverse that search, then use those motions for precise changes and deletions.',
  conceptIds: lineTargetingConcepts.map((concept) => concept.id), exerciseIds: lineTargetingExercises.map((exercise) => exercise.id),
  recommendedPrerequisiteUnitIds: ['unit.precise-text-objects'], prescribedExerciseIds: lineTargetingFirstSessionExerciseIds,
  completionCopy: 'Line-targeting session complete.',
}
