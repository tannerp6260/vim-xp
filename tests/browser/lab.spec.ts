import { expect, test } from '@playwright/test'

const editor = (page: import('@playwright/test').Page) => page.locator('.cm-content')
const documentText = (page: import('@playwright/test').Page) => editor(page).locator('.cm-line').allTextContents().then((lines) => `${lines.join('\n')}\n`)

test.beforeEach(async ({ page }) => { await page.goto('./#/lab'); await expect(page.getByRole('heading', { name: 'CodeMirror Vim feasibility laboratory' })).toBeVisible(); await editor(page).click() })

test('supports Normal, Insert, Visual, movement, counts, operators, and text objects', async ({ page }) => {
  await page.keyboard.press('i'); await page.keyboard.type('note '); await page.keyboard.press('Escape')
  await expect(page.getByTestId('trace')).toContainText('<Esc>')
  await page.keyboard.press('Home'); await page.keyboard.press('v'); await page.keyboard.press('l'); await expect(page.getByTestId('mode')).toContainText(/visual/i)
  await page.keyboard.press('Escape'); await page.keyboard.press('2'); await page.keyboard.press('w'); await page.keyboard.press('d'); await page.keyboard.press('i'); await page.keyboard.press('w')
  await page.keyboard.press('Escape'); await page.keyboard.press('f'); await page.keyboard.press('('); await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('('); await page.keyboard.type('value'); await page.keyboard.press('Escape')
  await expect(editor(page)).toContainText('value')
})

test('supports undo, redo, dot repeat, search, yank/delete/paste, and named registers', async ({ page }) => {
  await page.keyboard.press('i'); await page.keyboard.type('probe '); await page.keyboard.press('Escape'); await page.keyboard.press('u'); await page.keyboard.press('Control+r')
  await expect(editor(page)).toContainText('probe')
  await page.keyboard.press('w'); await page.keyboard.press('c'); await page.keyboard.press('i'); await page.keyboard.press('w'); await page.keyboard.type('X'); await page.keyboard.press('Escape'); await page.keyboard.press('w'); await page.keyboard.press('.')
  await page.keyboard.press('/'); await page.keyboard.type('string'); await page.keyboard.press('Enter'); await page.keyboard.press('n'); await page.keyboard.press('Shift+n')
  await page.keyboard.press('"'); await page.keyboard.press('a'); await page.keyboard.press('y'); await page.keyboard.press('y'); await page.keyboard.press('j'); await page.keyboard.press('"'); await page.keyboard.press('a'); await page.keyboard.press('p')
  await expect(page.getByTestId('trace')).toContainText('<C-r>')
})

test('semantic trace omits modifier-only events and preserves control chords', async ({ page }) => {
  await page.keyboard.down('Control'); await expect(page.getByTestId('trace')).toHaveText('No input yet')
  await page.keyboard.press('r'); await page.keyboard.up('Control'); await expect(page.getByTestId('trace')).toHaveText('<C-r>')
  await page.keyboard.press('Control+a'); await page.keyboard.press('Control+f')
  await expect(page.getByTestId('trace')).toHaveText('<C-r> <C-a> <C-f>')
  await expect(page.getByTestId('trace')).not.toContainText('<C-control>')
})

test('ordinary-key tracing and normalized replay remain operational', async ({ page }) => {
  await page.keyboard.press('w'); await expect(page.getByTestId('trace')).toHaveText('w')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByTestId('trace')).toContainText('w w 2 d w i X <Esc>')
})

test('supports marks, macro replay, and Ex substitution', async ({ page }) => {
  await page.keyboard.press('m'); await page.keyboard.press('a'); await page.keyboard.press('G'); await page.keyboard.press("'"); await page.keyboard.press('a'); await expect(page.getByTestId('cursor')).toHaveText('19')
  await page.keyboard.press('q'); await page.keyboard.press('a'); await page.keyboard.press('i'); await page.keyboard.type('X'); await page.keyboard.press('Escape'); await page.keyboard.press('q'); await page.keyboard.press('@'); await page.keyboard.press('a')
  expect(await documentText(page)).toContain('\nXXstd::string')
  await page.keyboard.press(':'); await page.keyboard.type('%s/string/text/g'); await page.keyboard.press('Enter')
  await expect(editor(page)).toContainText('text')
})

test('full recreation resets document, trace, and undo history', async ({ page }) => {
  const original = await documentText(page)
  await page.keyboard.press('m'); await page.keyboard.press('a')
  await page.keyboard.press('/'); await page.keyboard.type('string'); await page.keyboard.press('Enter')
  await page.keyboard.press('"'); await page.keyboard.press('a'); await page.keyboard.press('y'); await page.keyboard.press('y')
  await page.keyboard.press('q'); await page.keyboard.press('b'); await page.keyboard.press('i'); await page.keyboard.type('leak'); await page.keyboard.press('Escape'); await page.keyboard.press('q')
  await page.getByRole('button', { name: 'Reset editor and Vim state' }).click(); await editor(page).click(); await page.keyboard.press('u')
  await page.keyboard.press('@'); await page.keyboard.press('b'); await page.keyboard.press('"'); await page.keyboard.press('a'); await page.keyboard.press('p'); await page.keyboard.press("'"); await page.keyboard.press('a'); await page.keyboard.press('n')
  expect(await documentText(page)).toBe(original); await expect(page.getByTestId('trace')).not.toContainText('leak')
})

test('an unsupported Ex command does not damage the host application', async ({ page }) => {
  const original = await documentText(page); await page.keyboard.press(':'); await page.keyboard.type('terminal'); await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Observed state' })).toBeVisible(); expect(await documentText(page)).toBe(original)
})

test('production build loads and fixture switching works', async ({ page }) => {
  await page.getByLabel('Fixture').selectOption('shell'); await expect(editor(page)).toContainText('build_project')
})
