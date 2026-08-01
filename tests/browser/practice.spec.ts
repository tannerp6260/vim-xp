import { expect, test, type Page } from '@playwright/test'

const editor = (page: Page) => page.locator('.practice-card .cm-content')
const documentText = (page: Page) => editor(page).locator('.cm-line').allTextContents().then((lines) => lines.join('\n'))
const initial = `BuildConfig config{
    .environment = "staging",
    .retries = 3,
};
`
const expected = initial.replace('staging', 'production')

async function openPractice(page: Page) {
  await page.goto('./#/practice')
  await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible()
}

async function intendedEdit(page: Page, finish = true) {
  await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('"'); await page.keyboard.type('production')
  if (finish) await page.keyboard.press('Escape')
}

test('default and direct routes load practice under the Pages-style base path', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveURL(/\/vim-xp\/#\/practice$/)
  await expect(page.getByRole('heading', { name: 'Change inside quotes' })).toBeVisible()
  await page.goto('./#/practice')
  expect(new URL(page.url()).pathname).toBe('/vim-xp/')
  await expect(editor(page)).toBeVisible()
})

test('the diagnostic lab remains available', async ({ page }) => {
  await page.goto('./#/lab')
  await expect(page.getByRole('heading', { name: 'CodeMirror Vim feasibility laboratory' })).toBeVisible()
})

test('loads the declared initial document, cursor context, and Normal mode', async ({ page }) => {
  await openPractice(page)
  expect(await documentText(page)).toBe(initial)
  await expect(page.getByTestId('practice-mode')).toHaveText('normal')
  await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('"')
  await expect(page.getByTestId('practice-mode')).toHaveText('insert')
})

test('reveals hints progressively and demonstration replays then resets cleanly', async ({ page }) => {
  await openPractice(page)
  for (let index = 1; index <= 4; index += 1) {
    await page.getByRole('button', { name: index === 1 ? 'Hint' : 'Next hint' }).click()
    await expect(page.getByText(`Hint ${index} of 4`)).toBeVisible()
  }
  await page.getByRole('button', { name: 'Watch stepped demonstration' }).click()
  await expect(page.getByTestId('feedback')).toContainText('Demonstration complete', { timeout: 10_000 })
  expect(await documentText(page)).toBe(expected)
  await page.getByRole('button', { name: 'Check', exact: false }).click()
  await expect(page.getByTestId('feedback')).toContainText('That was the demonstration')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  expect(await documentText(page)).toBe(initial)
  await expect(page.getByTestId('practice-mode')).toHaveText('normal')
})

test('gives concise incorrect-document and correct-text-wrong-mode feedback', async ({ page }) => {
  await openPractice(page)
  await page.keyboard.press('x')
  await page.getByRole('button', { name: 'Check', exact: false }).click()
  await expect(page.getByTestId('feedback')).toContainText('does not match the goal')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await intendedEdit(page, false)
  expect(await documentText(page)).toBe(expected)
  await page.getByRole('button', { name: 'Check', exact: false }).click()
  await expect(page.getByTestId('feedback')).toContainText('text is correct')
  await expect(page.getByTestId('feedback')).toContainText('Normal mode')
})

test('accepts the intended reference strategy and supports retry', async ({ page }) => {
  await openPractice(page)
  await intendedEdit(page)
  await page.keyboard.press('Control+Enter')
  await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
  await expect(page.getByTestId('feedback')).toContainText('inner quote text object')
  expect(await documentText(page)).toBe(expected)
  await page.getByRole('button', { name: 'Retry exercise' }).click()
  expect(await documentText(page)).toBe(initial)
})

test('accepts a known equivalent strategy without scoring keystrokes', async ({ page }) => {
  await openPractice(page)
  await page.keyboard.press('d'); await page.keyboard.press('i'); await page.keyboard.press('"'); await page.keyboard.press('i'); await page.keyboard.type('production'); await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Check', exact: false }).click()
  await expect(page.getByTestId('feedback')).toContainText('Exercise complete')
  await expect(page.getByTestId('feedback')).toContainText('Another useful option is ci"')
  await expect(page.locator('body')).not.toContainText(/efficiency score|points awarded/i)
})

test('reset restores clean state after editing', async ({ page }) => {
  await openPractice(page)
  await page.keyboard.press('i'); await page.keyboard.type('leak'); await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  expect(await documentText(page)).toBe(initial)
  await page.keyboard.press('u')
  expect(await documentText(page)).toBe(initial)
})
