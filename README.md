# Vim Fluency engine laboratory

An early client-side Vim apprenticeship built on CodeMirror 6 + `@replit/codemirror-vim`. `#/practice` now provides a finite seven-exercise session drawn from nine C++, CMake, and shell variants around precise operator and inner-text-object edits. The original diagnostic laboratory remains at `#/lab`.

Progress stays in versioned browser-local storage. There are no accounts, backend, telemetry, runtime AI, timers, leaderboards, or broad Vim compatibility claims.

Hint 4 can open an explainable demonstration: step manually through each Vim idea, optionally autoplay it, inspect effects derived from real editor state, then reset and reproduce the edit.

The feasibility conclusion is **Suitable with bounded limitations**. The validated Vim adapter is pinned exactly at `@replit/codemirror-vim` 6.4.0. Chrome manual checks confirmed Ctrl-R redo, Ctrl-A increment, Ctrl-F forward movement in a sufficiently long document, around text objects, synchronized automated/stepped replay, and full reset. Ctrl-W closes the browser tab, is explicitly unsupported, and must not be taught as working in the browser. Firefox has automated Playwright coverage, but no manual Firefox pass is claimed.

Known architectural limits are package-global registers, marks, macros, search state, and related Vim state; reset isolation depends on the internal-looking `resetVimGlobalState_` compatibility hook; and the prototype supports one active Vim editor. The current production bundle-size warning is accepted for the diagnostic prototype and deferred until product development. See the evidence matrix for details.

## Fast start on Ubuntu

1. Install Git, build tools, and curl: `sudo apt update && sudo apt install git build-essential curl`.
2. Install [nvm](https://github.com/nvm-sh/nvm), reopen the terminal, then run `nvm install && nvm use`. The `.nvmrc` pins the supported Node 22 LTS line.
3. Install exactly the locked dependencies: `npm ci`.
4. Install browser test engines: `npx playwright install --with-deps chromium firefox`.
5. Start the lab: `npm run dev`.
6. Open the URL Vite prints (normally `http://localhost:5173/#/practice`). The diagnostic laboratory remains available at `http://localhost:5173/#/lab`.

Run the complete noninteractive suite with `npm run check`. Individual commands are `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser`, and `npm run build`. To inspect the exact production artifact, run `npm run build`, then `npm run preview`, and open the printed URL.

GitHub Actions runs the complete verification suite for pushes and pull requests. Pushes to `main` also trigger the Pages workflow, which verifies the project, builds it with the repository-derived base path, uploads `dist`, and deploys through the `github-pages` environment. For a repository named `vim-xp`, the deployed hash route is `https://<owner>.github.io/vim-xp/#/lab`; local development and preview continue to use `/` unless `VITE_BASE_PATH` is explicitly set.

See [local development](docs/local-development.md), [architecture](docs/architecture.md), [content authoring](docs/content-authoring.md), [engine evidence](docs/engine-evaluation.md), and [deployment](docs/deployment.md).
