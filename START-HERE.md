# Start Here: Vim Fluency with Codex CLI

This guide starts the local repository and runs the first implementation task. “Vim Fluency” is only a working folder name and can be changed later.

## What the first Codex task will do

- Scaffold a React, TypeScript, and Vite repository.
- Add detailed Ubuntu, Git, testing, and GitHub Pages documentation.
- Configure CI and a future Pages deployment.
- Build a CodeMirror Vim feasibility laboratory.
- Test the Vim behaviors most likely to matter for the first curriculum.
- Stop before building the larger learning product.
- Stop before committing, creating a remote, or pushing.

## 1. Choose a project location

For example:

~~~bash
mkdir -p ~/Desktop/vimXP
cd ~/Desktop/vimXP
~~~

## 2. Confirm Codex is available

~~~bash
codex --version
codex login status
~~~

If login status reports that you are not authenticated, run:

~~~bash
codex login
~~~

Follow the browser sign-in flow for your ChatGPT account.

## 3. Start Codex inside the empty project directory

~~~bash
codex
~~~

Use normal workspace-write permissions with approvals enabled. Do not use a mode that bypasses sandboxing or approvals.

## 4. Paste the first prompt

Open codex-prompt-01-repository-and-engine-prototype.md, copy everything beneath its introductory heading, and paste it into Codex.

The prompt is self-contained. The separate vim-product-blueprint.md is your durable planning reference; you may also place it in the project directory, but the first prompt does not depend on it.

## 5. Let Codex work, but review meaningful decisions

Codex may need to:

- Inspect installed Node and npm versions.
- Install project dependencies.
- Install Playwright browser binaries.
- Run local development and test commands.
- Create the initial file structure.

Approvals for ordinary project-local package installation and tests are expected. Pause if it asks to:

- Delete or overwrite unrelated files.
- Use unrestricted system access.
- Push to GitHub.
- Create or modify a remote repository.
- Add a backend or paid service.

## 6. When Codex finishes

Save its final report. In the terminal, inspect the work:

~~~bash
git status
npm run check
npm run dev
~~~

Open the local URL displayed by Vite and manually use the Vim laboratory.

Then test the production build:

~~~bash
npm run build
npm run preview
~~~

Open the preview URL and confirm it also works.

Do not worry if the exact script names differ slightly; Codex must document the authoritative commands in README.md and docs/local-development.md.

## 7. Return for the next design and implementation step

Bring back:

- Codex’s final summary.
- Its CodeMirror feasibility conclusion.
- Any failed or unverified tests.
- Any behavior that felt wrong during manual Vim testing.
- The repository name you want to use on GitHub, if chosen.

The next prompt should be based on this evidence. It will either:

- Accept CodeMirror and build the first complete learning exercise,
- request a small bounded engine fix or additional test,
- or evaluate an alternative engine if the feasibility gate fails.

## GitHub deployment

Do not create the production repository or enable Pages before reviewing the local prototype unless you specifically want to. Codex will create step-by-step deployment documentation during the first task.

The intended workflow is:

- main remains deployable.
- Feature branches are optional for nontrivial changes.
- Pull requests or branch pushes run verification.
- Merging to main triggers GitHub Pages deployment.
- No permanent develop branch is required.
