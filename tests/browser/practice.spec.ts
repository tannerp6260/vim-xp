import { expect, test, type Page } from '@playwright/test'

const editor = (page: Page) => page.locator('.practice-card .cm-content')
const documentText = (page: Page) => editor(page).locator('.cm-line').allTextContents().then((lines) => lines.join('\n'))
async function openPractice(page: Page) { await page.goto('./#/practice'); await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible() }
async function changeQuotes(page: Page, value = 'production') { await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('"'); await page.keyboard.type(value); await page.keyboard.press('Escape') }
async function perform(page: Page, keys: string[], inserted = '') { for (const key of keys) await page.keyboard.press(key); if (inserted) await page.keyboard.type(inserted); if (keys[0] === 'c') await page.keyboard.press('Escape'); await page.keyboard.press('Control+Enter') }

test('default and direct routes load practice under the Pages-style base path', async ({ page }) => {
  await page.goto('./'); await expect(page).toHaveURL(/\/vim-xp\/#\/practice$/); await expect(page.getByText('1 of 7')).toBeVisible()
  await page.goto('./#/practice'); expect(new URL(page.url()).pathname).toBe('/vim-xp/'); await expect(editor(page)).toBeVisible()
})

test('the diagnostic lab remains available', async ({ page }) => { await page.goto('./#/lab'); await expect(page.getByRole('heading', { name: 'CodeMirror Vim feasibility laboratory' })).toBeVisible() })

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

test('reveals progressive hints and demonstration, then allows a clean retry', async ({ page }) => {
  await openPractice(page); for (let index = 1; index <= 4; index += 1) { await page.getByRole('button', { name: index === 1 ? 'Hint' : 'Next hint' }).click(); await expect(page.getByText(`Hint ${index} of 4`)).toBeVisible() }
  await page.getByRole('button', { name: 'Watch stepped demonstration' }).click(); await expect(page.getByTestId('feedback')).toContainText('Demonstration complete', { timeout: 10_000 })
  await page.getByRole('button', { name: 'Reset exercise' }).click(); await expect(page.getByTestId('practice-mode')).toHaveText('normal')
})

test('all-skipped session reports zero completed without claiming edits', async ({ page }) => {
  await openPractice(page); await page.getByRole('button', { name: 'Skip for now' }).click(); await expect(page.getByText('2 of 7')).toBeVisible(); await page.reload(); await expect(page.getByText('2 of 7')).toBeVisible()
  for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible(); await expect(page.getByTestId('session-summary')).toHaveText('0 completed · 7 skipped'); await expect(page.getByRole('heading', { name: 'Seven precise edits, done.' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Practice another session' }).click(); await expect(page.getByText('1 of 7')).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Seven precise edits, done.' })).toBeVisible(); await expect(page.getByTestId('session-summary')).toHaveText('You completed every exercise.')
})

test('reset local progress requires confirmation and restarts the prescribed session', async ({ page }) => {
  await openPractice(page); await page.getByRole('button', { name: 'Skip for now' }).click(); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click(); await expect(page.getByText('1 of 7')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible()
})

test('reset progress clears hinted and demonstrated transient state and safely cancels replay', async ({ page }) => {
  await openPractice(page); for (let index = 0; index < 4; index += 1) await page.getByRole('button', { name: index ? 'Next hint' : 'Hint' }).click()
  await page.getByRole('button', { name: 'Watch stepped demonstration' }).click(); await expect(page.getByRole('button', { name: 'Skip for now' })).toBeDisabled()
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Reset local progress' }).click()
  await expect(page.getByText('1 of 7')).toBeVisible(); await expect(page.locator('.hint-card')).toHaveCount(0); await expect(page.getByTestId('feedback')).toHaveText(/Make the edit/); await expect(page.getByTestId('practice-mode')).toHaveText('normal')
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
