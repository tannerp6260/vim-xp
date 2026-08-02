# Local development on Ubuntu

1. Install prerequisites: `sudo apt update && sudo apt install git build-essential curl`.
2. Install nvm using its official instructions, then reopen the terminal.
3. From this directory run `nvm install` and `nvm use`. Confirm `node --version` is at least `v22.12` and begins with `v22`, then confirm `npm --version` works.
4. Run `npm ci`. Use `npm install` only when intentionally changing dependencies and reviewing `package-lock.json`.
5. Run `npx playwright install --with-deps chromium firefox` once per Playwright upgrade.
6. Run `npm run dev`, then open the printed URL. Vite normally uses `http://localhost:5173`; the diagnostic hash is `#/lab`.

Commands:

- `npm run lint`: static lint rules.
- `npm run typecheck`: strict TypeScript project checks.
- `npm test`: pure unit tests once.
- `npm run test:watch`: unit tests while editing.
- `npm run test:browser`: Chromium and Firefox integration tests against a production build.
- `npm run test:browser:chromium`: faster Chromium-only browser run.
- `npm run build`: type-check and write the production site to `dist/`.
- `npm run preview`: serve the already-built artifact (normally at `http://localhost:4173`).
- `npm run check`: lint, types, unit tests, build, then both browser projects.

Practice progress is stored only in the browser under `vim-xp-progress`. Use “Reset local progress” and confirm when manually replaying the prescribed first session. Pure scheduler tests inject clocks and seeds and never depend on real time.

To verify the exact production application, run `npm run build`, then `npm run preview`, and open the printed preview URL. Stop either server with Ctrl+C. See `troubleshooting.md` for browser and Node problems.
