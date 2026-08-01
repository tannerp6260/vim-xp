import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/vim-xp/', trace: 'retain-on-failure' },
  webServer: { command: 'VITE_BASE_PATH=/vim-xp/ VITE_OUT_DIR=dist/vim-xp npm run build && python -m http.server 4173 --bind 127.0.0.1 --directory dist', url: 'http://127.0.0.1:4173/vim-xp/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})
