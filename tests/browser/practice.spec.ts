import { expect, test, type Page } from '@playwright/test'

const editor = (page: Page) => page.locator('.practice-card .cm-content')
const documentText = (page: Page) => editor(page).locator('.cm-line').allTextContents().then((lines) => lines.join('\n'))
async function openPractice(page: Page) { await page.goto('./#/practice'); await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible() }
async function changeQuotes(page: Page, value = 'production') { await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('"'); await page.keyboard.type(value); await page.keyboard.press('Escape') }
async function perform(page: Page, keys: string[], inserted = '') { for (const key of keys) await page.keyboard.press(key); if (inserted) await page.keyboard.type(inserted); if (keys[0] === 'c') await page.keyboard.press('Escape'); await page.keyboard.press('Control+Enter') }
async function openDemonstration(page: Page) { for (let index = 1; index <= 4; index += 1) await page.getByRole('button', { name: index === 1 ? 'Hint' : 'Next hint' }).click(); await page.getByRole('button', { name: 'Watch stepped demonstration' }).click(); await expect(page.getByTestId('demonstration-player')).toBeVisible() }
async function nextDemoStep(page: Page, stepId: string) { await page.getByRole('button', { name: 'Next step' }).click(); await expect(page.locator(`[data-step-id="${stepId}"] .step-status`)).toHaveText('Completed') }
async function resetProgressDuringDemo(page: Page) { page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click() }
async function expectStableResetAndCleanAttempt(page: Page, initialText: string) {
  await page.waitForTimeout(750); await expect(page.getByTestId('demonstration-player')).toHaveCount(0); expect(await documentText(page)).toBe(initialText); await expect(page.getByTestId('practice-mode')).toHaveText('normal'); await expect(page.locator('.demo-emphasis, .demo-boundary')).toHaveCount(0); await expect(page.locator('.demo-effect, .demo-timeline')).toHaveCount(0)
  await changeQuotes(page); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
}
async function loadExercise(page: Page, exerciseId: string, unitId?: string) {
  await page.goto('./#/practice'); await page.evaluate(({ exerciseId, unitId }) => localStorage.setItem('vim-xp-progress', JSON.stringify({ schemaVersion: 3, curriculumVersion: '3.0.0', learner: { concepts: {}, attempts: [] }, recentVariants: [], session: { id: `test-${exerciseId}`, exerciseIds: [exerciseId], prescribed: false, createdAt: 1, seed: 1, index: 0, completed: false, ...(unitId ? { unitId } : {}) } })), { exerciseId, unitId }); await page.reload(); await expect(editor(page)).toBeVisible()
}
async function replayTokens(page: Page, tokens: string[]) { for (const token of tokens) { if (token === '<Esc>') await page.keyboard.press('Escape'); else if (token.length === 1) await page.keyboard.press(token === ' ' ? 'Space' : token); else await page.keyboard.type(token) } }

test('default and direct routes load practice under the Pages-style base path', async ({ page }) => {
  await page.goto('./'); await expect(page).toHaveURL(/\/vim-xp\/#\/practice$/); await expect(page.getByText('1 of 7')).toBeVisible()
  await page.goto('./#/practice'); expect(new URL(page.url()).pathname).toBe('/vim-xp/'); await expect(editor(page)).toBeVisible()
})

test('the diagnostic lab remains available', async ({ page }) => { await page.goto('./#/lab'); await expect(page.getByRole('heading', { name: 'CodeMirror Vim feasibility laboratory' })).toBeVisible() })

test('curriculum overview lists both advisory units and supports direct refresh', async ({ page }) => {
  await page.goto('./#/curriculum'); await expect(page).toHaveURL(/\/vim-xp\/#\/curriculum$/); await expect(page.getByRole('heading', { name: 'Choose what to practice' })).toBeVisible(); await expect(page.locator('[data-unit-id]')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Precise text objects' })).toBeVisible(); await expect(page.getByRole('heading', { name: 'Target within a line' })).toBeVisible(); await expect(page.getByText(/You can start here now/)).toBeVisible(); await page.reload(); await expect(page.locator('[data-unit-id="unit.line-targeting"]')).toBeVisible()
})

test('advanced learners can start unit two and replacing another unfinished unit requires confirmation', async ({ page }) => {
  await page.goto('./#/curriculum'); await page.locator('[data-unit-id="unit.line-targeting"]').getByRole('button', { name: 'Begin unit' }).click(); await expect(page.getByText('Target within a line session')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Land on the assignment' })).toBeVisible()
  await page.goto('./#/curriculum'); page.once('dialog', (dialog) => dialog.dismiss()); await page.locator('[data-unit-id="unit.precise-text-objects"]').getByRole('button').click(); await expect(page).toHaveURL(/#\/curriculum$/)
  page.once('dialog', (dialog) => dialog.accept()); await page.locator('[data-unit-id="unit.precise-text-objects"]').getByRole('button').click(); await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible()
})

test('later line-targeting focus includes prior-unit review', async ({ page }) => {
  await page.goto('./#/curriculum'); await page.evaluate(() => localStorage.setItem('vim-xp-progress', JSON.stringify({ schemaVersion: 3, curriculumVersion: '3.0.0', learner: { concepts: { 'concept.find-forward': { strength: .22, confidence: .18, successes: 1, exposures: 1, variants: ['line-find-assignment'], lastSeenAt: 1, dueAt: 2, recentExerciseIds: ['exercise.line-find-assignment'] } }, attempts: [{ sessionId: 'prior-line', exerciseId: 'exercise.line-find-assignment', conceptIds: ['concept.find-forward'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 1 }] }, recentVariants: ['line-find-assignment'] }))); await page.reload(); await page.locator('[data-unit-id="unit.line-targeting"]').getByRole('button', { name: 'Practice unit' }).click()
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('vim-xp-progress')!).session.exerciseIds as string[]); expect(ids.filter((id) => id.startsWith('exercise.line-'))).toHaveLength(5); expect(ids.filter((id) => !id.startsWith('exercise.line-'))).toHaveLength(2)
})

test('f= navigation uses cursor-aware correctness and unknown correct movement still passes', async ({ page }) => {
  await loadExercise(page, 'exercise.line-find-assignment', 'unit.line-targeting'); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('cursor has not reached')
  await page.getByRole('button', { name: 'Reset exercise' }).click(); await replayTokens(page, ['1', '7', 'l']); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('Exercise complete'); await expect(page.getByTestId('feedback')).toContainText('several valid ways')
})

test('line movement demonstrations explain and emphasize the observed cursor destination', async ({ page }) => {
  await loadExercise(page, 'exercise.line-find-assignment', 'unit.line-targeting'); await openDemonstration(page); await expect(page.locator('[data-step-id="find"] kbd')).toHaveText('f'); await expect(page.locator('[data-step-id="target"] kbd')).toHaveText('=')
  await nextDemoStep(page, 'find'); await expect(page.getByTestId('demo-effect')).toContainText('No document change yet'); await nextDemoStep(page, 'target'); await expect(page.getByTestId('demo-effect')).toContainText(/line 1, column 18, on “=”/); await expect(page.locator('.demo-emphasis')).toHaveCount(1)
})

test('df Space is displayed semantically and passes through the real adapter', async ({ page }) => {
  await loadExercise(page, 'exercise.line-delete-artifact', 'unit.line-targeting'); await openDemonstration(page); await expect(page.locator('[data-step-id="target"] kbd')).toHaveText('Space'); await page.getByRole('button', { name: 'Exit demonstration / reset and try it yourself' }).click(); await replayTokens(page, ['d', 'f', ' ']); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
})

test('a realistic schema 2 payload migrates with learner evidence and its session intact', async ({ page }) => {
  await page.goto('./#/practice'); await page.evaluate(() => localStorage.setItem('vim-xp-progress', JSON.stringify({ schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: { 'concept.inner-quotes': { strength: .44, confidence: .31, successes: 2, exposures: 3, variants: ['quotes-environment'], lastSeenAt: 100, dueAt: 200, recentExerciseIds: ['exercise.change-inside-quotes'] } }, attempts: [{ sessionId: 'legacy', exerciseId: 'exercise.change-inside-quotes', conceptIds: ['concept.inner-quotes'], correct: true, incorrectChecks: 0, hintLevel: 0, demonstrated: false, skipped: false, completedAt: 100 }] }, recentVariants: ['quotes-environment'], session: { id: 'legacy', exerciseIds: ['exercise.change-inside-quotes', 'exercise.quotes-cmake-build-type'], prescribed: true, createdAt: 1, seed: 1, index: 1, completed: false } }))); await page.reload(); await expect(page.getByText('2 of 2')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vim-xp-progress')!)); expect(stored).toMatchObject({ schemaVersion: 3, curriculumVersion: '3.0.0', session: { id: 'legacy', index: 1, unitId: 'unit.precise-text-objects' }, learner: { concepts: { 'concept.inner-quotes': { strength: .44, confidence: .31 } } } })
})

test('renders semantic command markup without raw backticks', async ({ page }) => {
  await openPractice(page); await expect(page.locator('.goal code', { hasText: 'staging' })).toBeVisible(); await expect(page.locator('.goal')).not.toContainText('`')
  for (let index = 0; index < 3; index += 1) await page.getByRole('button', { name: index ? 'Next hint' : 'Hint' }).click()
  await expect(page.locator('.hint-card code', { hasText: 'ci"' })).toBeVisible(); await expect(page.locator('kbd')).toHaveCount(2)
})

test('supports incorrect recovery, intended completion, progress, and isolated transition', async ({ page }) => {
  await openPractice(page); await page.keyboard.press('x'); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('does not match')
  await page.getByRole('button', { name: 'Reset exercise' }).click(); await changeQuotes(page); await page.keyboard.press('Control+Enter'); await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
  await page.keyboard.press('Control+Enter'); await expect(page.getByText('2 of 7')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Switch the build type' })).toBeVisible()
  const fresh = await documentText(page); await page.keyboard.press('u'); expect(await documentText(page)).toBe(fresh)
})

test('accepts a correct alternative and keeps correctness independent of strategy', async ({ page }) => {
  await openPractice(page); await page.keyboard.press('d'); await page.keyboard.press('i'); await page.keyboard.press('"'); await page.keyboard.press('i'); await page.keyboard.type('production'); await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('Exercise complete'); await expect(page.getByTestId('feedback')).toContainText('Another useful option')
})

test('manual ci" demonstration explains and executes one semantic step at a time', async ({ page }) => {
  await openPractice(page); const initialText = await documentText(page); await openDemonstration(page)
  expect(await documentText(page)).toBe(initialText); await expect(page.getByTestId('practice-mode')).toHaveText('normal'); await expect(page.locator('[data-step-id="operator"] .step-status')).toHaveText('Upcoming')
  await expect(page.locator('[data-step-id="operator"] kbd')).toHaveText('c'); await expect(page.locator('[data-step-id="inner"] kbd')).toHaveText('i'); await expect(page.locator('[data-step-id="target"] kbd')).toHaveText('"'); await expect(page.locator('[data-step-id="replacement"] .step-token code')).toHaveText('production'); await expect(page.locator('[data-step-id="normal-mode"] kbd')).toHaveText('Esc')
  await nextDemoStep(page, 'operator'); expect(await documentText(page)).toBe(initialText); await expect(page.getByTestId('demo-effect')).toContainText('No document change yet')
  await nextDemoStep(page, 'inner'); expect(await documentText(page)).toBe(initialText); await expect(page.getByTestId('demo-effect')).toContainText('No document change yet')
  await nextDemoStep(page, 'target'); expect(await documentText(page)).toBe(initialText.replace('staging', '')); await expect(page.getByTestId('demo-effect')).toContainText('Removed “staging”'); await expect(page.getByTestId('demo-effect')).toContainText('Normal to Insert'); await expect(page.getByTestId('practice-mode')).toHaveText('insert')
  await nextDemoStep(page, 'replacement'); expect(await documentText(page)).toBe(initialText.replace('staging', 'production')); await expect(page.getByTestId('demo-effect')).toContainText('Inserted “production”')
  await nextDemoStep(page, 'normal-mode'); await expect(page.getByTestId('practice-mode')).toHaveText('normal'); await expect(page.getByTestId('demo-effect')).toContainText('Insert to Normal'); await expect(page.getByText('Demonstration complete.', { exact: true })).toBeVisible()
})

test('previous reconstructs deterministically and restart restores the untouched editor', async ({ page }) => {
  await openPractice(page); const initialText = await documentText(page); await openDemonstration(page)
  for (let index = 0; index < 5; index += 1) await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'Previous step' }).click(); await expect(page.getByTestId('practice-mode')).toHaveText('insert'); expect(await documentText(page)).toBe(initialText.replace('staging', 'production'))
  await page.getByRole('button', { name: 'Restart' }).click(); await expect(page.getByTestId('practice-mode')).toHaveText('normal'); expect(await documentText(page)).toBe(initialText); await expect(page.locator('[data-step-id="operator"] .step-status')).toHaveText('Upcoming')
})

test('play pauses without a delayed step and demonstration locks conflicting practice actions', async ({ page }) => {
  await openPractice(page); const initialText = await documentText(page); await openDemonstration(page); await page.getByLabel('Playback speed').selectOption('fast')
  await expect(page.getByRole('button', { name: 'Check', exact: false })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Skip for now' })).toBeDisabled(); await page.keyboard.type('corrupt'); expect(await documentText(page)).toBe(initialText)
  await page.getByRole('button', { name: 'Play' }).click(); await page.getByRole('button', { name: 'Pause' }).click(); await page.waitForTimeout(900); await expect(page.locator('[data-step-id="operator"] .step-status')).toHaveText('Upcoming'); expect(await documentText(page)).toBe(initialText)
})

test('exiting demonstration resets the editor for a clean learner attempt', async ({ page }) => {
  await openPractice(page); await openDemonstration(page); await page.getByRole('button', { name: 'Next step' }).click(); await page.getByRole('button', { name: 'Exit demonstration / reset and try it yourself' }).click(); await expect(page.getByTestId('demonstration-player')).toHaveCount(0)
  await changeQuotes(page); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
})

test('all-skipped session reports zero completed without claiming edits', async ({ page }) => {
  await openPractice(page); await page.getByRole('button', { name: 'Skip for now' }).click(); await expect(page.getByText('2 of 7')).toBeVisible(); await page.reload(); await expect(page.getByText('2 of 7')).toBeVisible()
  for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible(); await expect(page.getByTestId('session-summary')).toHaveText('0 completed · 7 skipped'); await expect(page.getByRole('heading', { name: 'Seven precise edits, done.' })).toHaveCount(0)
  await page.getByRole('button', { name: /Continue to|Practice another/ }).click(); await expect(page.getByText('1 of 7')).toBeVisible()
})

test('mixed session reports completed and skipped counts neutrally', async ({ page }) => {
  await openPractice(page); await changeQuotes(page); await page.keyboard.press('Control+Enter'); await page.keyboard.press('Control+Enter')
  for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByTestId('session-summary')).toHaveText('1 completed · 6 skipped'); await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible()
})

test('genuinely completing all seven earns the precise-edits summary', async ({ page }) => {
  await openPractice(page)
  const sequence: [string[], string][] = [[['c', 'i', '"'], 'production'], [['c', 'i', '"'], 'Release'], [['c', 'i', 'w'], 'production'], [['c', 'i', '"'], 'https://api.example.com'], [['d', 'i', '('], ''], [['c', 'i', 'w'], 'warning'], [['c', 'i', '('], 'smoke']]
  for (let index = 0; index < sequence.length; index += 1) { await perform(page, ...sequence[index]); await expect(page.getByTestId('feedback')).toContainText('Exercise complete'); await page.keyboard.press('Control+Enter') }
  await expect(page.getByRole('heading', { name: 'Seven precise edits, done.' })).toBeVisible(); await expect(page.getByTestId('session-summary')).toHaveText('You completed every exercise.'); await expect(page.getByRole('button', { name: 'Continue to Target within a line' })).toBeVisible()
})

test('reset local progress requires confirmation and restarts the prescribed session', async ({ page }) => {
  await openPractice(page); await page.getByRole('button', { name: 'Skip for now' }).click(); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click(); await expect(page.getByText('1 of 7')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible()
})

test('reset progress clears hinted and demonstrated transient state and safely cancels replay', async ({ page }) => {
  await openPractice(page); await openDemonstration(page); await page.getByRole('button', { name: 'Play' }).click(); await expect(page.getByRole('button', { name: 'Skip for now' })).toBeDisabled()
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click()
  await expect(page.getByText('1 of 7')).toBeVisible(); await expect(page.locator('.hint-card')).toHaveCount(0); await expect(page.getByTestId('feedback')).toHaveText(/Make the edit/); await expect(page.getByTestId('practice-mode')).toHaveText('normal')
})

test('reset progress cancels stale Previous and Restart reconstruction after editor recreation begins', async ({ page }) => {
  for (const operation of ['Previous step', 'Restart']) {
    await openPractice(page); const initialText = await documentText(page); await openDemonstration(page); await nextDemoStep(page, 'operator'); await nextDemoStep(page, 'inner'); await nextDemoStep(page, 'target')
    await page.evaluate(() => { window.requestAnimationFrame = ((callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 180)) as typeof window.requestAnimationFrame; window.cancelAnimationFrame = ((handle: number) => window.clearTimeout(handle)) as typeof window.cancelAnimationFrame })
    await page.getByRole('button', { name: operation }).click(); await resetProgressDuringDemo(page); await expectStableResetAndCleanAttempt(page, initialText)
    page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click()
  }
})

test('reset progress aborts multi-character literal typing without stale text or effects', async ({ page }) => {
  await openPractice(page); const initialText = await documentText(page); await openDemonstration(page); await nextDemoStep(page, 'operator'); await nextDemoStep(page, 'inner'); await nextDemoStep(page, 'target')
  await page.getByRole('button', { name: 'Next step' }).click(); await expect(page.locator('[data-step-id="replacement"] .step-status')).toHaveText('Active'); await resetProgressDuringDemo(page); await expectStableResetAndCleanAttempt(page, initialText)
})

test('demonstration remains assisted exposure under the existing learner weights', async ({ page }) => {
  await openPractice(page); await openDemonstration(page); await page.getByRole('button', { name: 'Next step' }).click(); await page.getByRole('button', { name: 'Exit demonstration / reset and try it yourself' }).click(); await changeQuotes(page); await page.keyboard.press('Control+Enter'); await page.keyboard.press('Control+Enter')
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('vim-xp-progress')!).learner.concepts['concept.inner-quotes']); expect(state.strength).toBe(0); expect(state.confidence).toBe(.03)
})

test('di( demonstration has exactly three keys and finishes in Normal mode', async ({ page }) => {
  await page.goto('./#/practice'); await page.evaluate(() => localStorage.setItem('vim-xp-progress', JSON.stringify({ schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: {}, attempts: [] }, recentVariants: [], session: { id: 'di-demo', exerciseIds: ['exercise.parens-clear-cache-args'], prescribed: false, createdAt: 1, seed: 1, index: 0, completed: false } }))); await page.reload(); await openDemonstration(page)
  await expect(page.locator('.demo-timeline li')).toHaveCount(3); await expect(page.locator('.demo-timeline .step-token code')).toHaveCount(0); await expect(page.locator('.demo-timeline')).not.toContainText('Esc')
  for (let index = 0; index < 3; index += 1) await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.getByTestId('practice-mode')).toHaveText('normal'); expect(await documentText(page)).toBe('cache.invalidate();\nrefresh_view();\n'); await expect(page.getByText('Demonstration complete.', { exact: true })).toBeVisible()
})

test('ordinary exercise reset preserves requested assistance within the attempt', async ({ page }) => { await openPractice(page); await page.getByRole('button', { name: 'Hint' }).click(); await page.getByRole('button', { name: 'Reset exercise' }).click(); await expect(page.getByText('Hint 1 of 4')).toBeVisible() })

test('every catalog reference replays through the real Vim adapter and satisfies its outcome', async ({ page }) => {
  const references = [
    ['exercise.change-inside-quotes', ['c', 'i', '"'], 'production'],
    ['exercise.quotes-cmake-build-type', ['c', 'i', '"'], 'Release'],
    ['exercise.quotes-shell-base-url', ['c', 'i', '"'], 'https://api.example.com'],
    ['exercise.word-shell-target', ['c', 'i', 'w'], 'production'],
    ['exercise.word-cpp-log-level', ['c', 'i', 'w'], 'warning'],
    ['exercise.word-cmake-retry-policy', ['c', 'i', 'w'], 'exponential'],
    ['exercise.parens-clear-cache-args', ['d', 'i', '('], ''],
    ['exercise.parens-connect', ['c', 'i', '('], 'replica, 5'],
    ['exercise.parens-run-checks', ['c', 'i', '('], 'smoke'],
  ] as const
  await page.goto('./#/practice')
  for (const [id, keys, inserted] of references) {
    await page.evaluate(({ exerciseId }) => localStorage.setItem('vim-xp-progress', JSON.stringify({ schemaVersion: 2, curriculumVersion: '2.0.0', learner: { concepts: {}, attempts: [] }, recentVariants: [], session: { id: 'reference-test', exerciseIds: [exerciseId], prescribed: false, createdAt: 1, seed: 1, index: 0, completed: false } })), { exerciseId: id })
    await page.reload(); await expect(editor(page)).toBeVisible()
    for (const key of keys) await page.keyboard.press(key)
    if (inserted) await page.keyboard.type(inserted)
    if (keys[0] === 'c') await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Check', exact: false }).click()
    await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
    if (id === 'exercise.parens-clear-cache-args') await expect(page.getByTestId('feedback')).toContainText('di(')
  }
})

test('all twelve line-targeting references replay through the pinned Vim adapter', async ({ page }) => {
  const references: [string, string[]][] = [
    ['exercise.line-find-assignment', ['f', '=']], ['exercise.line-find-cmake-paren', ['f', '(']], ['exercise.line-till-shell-quote', ['t', '"']], ['exercise.line-till-cpp-close-paren', ['t', ')']],
    ['exercise.line-repeat-path-colon', ['f', ':', ';']], ['exercise.line-repeat-cpp-comma', ['f', ',', ';']], ['exercise.line-reverse-cpp-comma', ['f', ',', ';', ',']], ['exercise.line-reverse-shell-colon', ['f', ':', ';', ',']],
    ['exercise.line-change-first-argument', ['c', 't', ',', 'replica', '<Esc>']], ['exercise.line-change-cmake-argument', ['c', 't', ')', 'exponential', '<Esc>']], ['exercise.line-change-shell-semicolon', ['c', 't', ';', 'production', '<Esc>']], ['exercise.line-delete-artifact', ['d', 'f', ' ']],
  ]
  for (const [id, tokens] of references) { await loadExercise(page, id, 'unit.line-targeting'); await replayTokens(page, tokens); await page.getByRole('button', { name: 'Check', exact: false }).click(); await expect(page.getByTestId('feedback'), id).toContainText('Exercise complete') }
})
