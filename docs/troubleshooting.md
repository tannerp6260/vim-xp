# Troubleshooting

- **Vite reports an unsupported Node version:** run `nvm install && nvm use`; confirm Node 22.12 or newer in the Node 22 LTS line. A system Node 18 is insufficient.
- **`npm ci` says the lockfile is missing or mismatched:** do not delete files. Confirm you are in the repository root. Use `npm install` only when deliberately updating dependencies.
- **A Playwright executable is missing:** run `npx playwright install --with-deps chromium firefox`.
- **Linux browser libraries are missing:** rerun the preceding command with sudo approval when Playwright requests it, or run its printed `install-deps` command.
- **Port 5173/4173 is busy:** Vite prints a replacement port; use that URL. Stop stale servers with Ctrl+C in their terminal.
- **Vim input appears inactive:** click inside the editor and confirm it has a visible focus outline. Reset recreates and refocuses it.
- **Pages is blank or assets 404:** inspect the workflow build log and confirm `VITE_BASE_PATH` produced `/repository-name/`; do not add that base during ordinary local development.
- **Firefox differs from Chromium:** retain the failing test and record it in `engine-evaluation.md`; do not relabel it as supported.
