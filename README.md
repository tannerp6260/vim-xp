# Vim Fluency engine laboratory

An evidence-gathering prototype for a client-side Vim apprenticeship. This repository currently contains a CodeMirror 6 + `@replit/codemirror-vim` diagnostic lab—not the learning product or curriculum.

The feasibility conclusion is **Suitable with bounded limitations**. The validated Vim adapter is pinned exactly at `@replit/codemirror-vim` 6.4.0. Chrome manual checks confirmed Ctrl-R redo, Ctrl-A increment, Ctrl-F forward movement in a sufficiently long document, around text objects, synchronized automated/stepped replay, and full reset. Ctrl-W closes the browser tab, is explicitly unsupported, and must not be taught as working in the browser. Firefox has automated Playwright coverage, but no manual Firefox pass is claimed.

Known architectural limits are package-global registers, marks, macros, search state, and related Vim state; reset isolation depends on the internal-looking `resetVimGlobalState_` compatibility hook; and the prototype supports one active Vim editor. The current production bundle-size warning is accepted for the diagnostic prototype and deferred until product development. See the evidence matrix for details.

## Fast start on Ubuntu

1. Install Git, build tools, and curl: `sudo apt update && sudo apt install git build-essential curl`.
2. Install [nvm](https://github.com/nvm-sh/nvm), reopen the terminal, then run `nvm install && nvm use`. The `.nvmrc` pins the supported Node 22 LTS line.
3. Install exactly the locked dependencies: `npm ci`.
4. Install browser test engines: `npx playwright install --with-deps chromium firefox`.
5. Start the lab: `npm run dev`.
6. Open the URL Vite prints (normally `http://localhost:5173/#/lab`).

Run the complete noninteractive suite with `npm run check`. Individual commands are `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser`, and `npm run build`. To inspect the exact production artifact, run `npm run build`, then `npm run preview`, and open the printed URL.

See [local development](docs/local-development.md), [architecture](docs/architecture.md), [engine evidence](docs/engine-evaluation.md), and [deployment](docs/deployment.md).
