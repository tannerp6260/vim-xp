# Codex CLI Prompt 01: Repository and Vim Engine Feasibility Prototype

Copy the entire prompt below into Codex CLI while Codex is running inside the new project directory.

---

You are acting as the senior engineer responsible for establishing a new local repository and producing an evidence-based Vim engine feasibility prototype.

This is a new fun side project, developed on Ubuntu and intended to be hosted as a free static GitHub Pages application. I will use Codex iteratively, so favor clarity, tests, documentation, and small reversible decisions over attempting to build the full product immediately.

## Product summary

The working product concept is an interactive Vim apprenticeship for developers who already understand basic Vim but want to become substantially more fluent.

Product promise:

“Discover the Vim techniques experienced developers rely on—and practice them until they become part of how you edit.”

The defining experience will eventually be:

1. Perform realistic edits inside a Vim-like editor.
2. Receive deterministic correctness feedback.
3. Reveal progressively stronger hints when needed.
4. Encounter varied applications of the same technique soon afterward.
5. Revisit weak concepts frequently and mastered concepts very occasionally.
6. Accept multiple correct solutions and coach rather than punish.

The MVP will remain completely client-side:

- No backend.
- No accounts.
- No runtime AI.
- No paid API.
- No hosted database.
- No social or competitive features.
- Progress will eventually be stored locally and exportable.

The initial content domains will be C++, CMake, and shell scripts. The first curriculum slice will focus on precise, composable, single-buffer editing.

## Scope of this task

Do not build the full application, curriculum, placement system, adaptive scheduler, or polished product UI.

This task has two goals:

1. Establish a clean, documented, testable repository that I can run locally on Ubuntu and later deploy through GitHub Pages.
2. Build an isolated CodeMirror 6 Vim feasibility laboratory that gives us concrete evidence about whether @replit/codemirror-vim is suitable.

## Safety and working-directory rules

1. Inspect the current directory before changing anything.
2. Preserve any existing user files and changes.
3. If the directory contains an unrelated project or conflicting files, stop and explain the conflict.
4. Do not create a GitHub remote.
5. Do not push anything.
6. Do not commit unless I explicitly ask after reviewing the result.
7. Do not use destructive Git or filesystem commands.
8. Do not introduce a backend, authentication, telemetry service, or runtime AI dependency.

## Repository foundation

Use:

- React.
- TypeScript with strict checking.
- Vite.
- npm with a committed lockfile.
- CodeMirror 6.
- @replit/codemirror-vim.
- Vitest for pure TypeScript and unit testing.
- Playwright for real-browser editor and end-to-end tests.
- A current, supported linting setup.

Select current stable package versions that are mutually compatible. Do not blindly use versions copied from an old template. Use a current active Node LTS compatible with the chosen Vite version, record it in an .nvmrc file, and document it.

Avoid adding a state-management library, component framework, backend library, or production analytics package.

Use hash-based client routing or the smallest equivalent approach suitable for GitHub Pages.

## Required repository files

Create and populate:

- README.md
- AGENTS.md
- docs/product-blueprint.md
- docs/architecture.md
- docs/local-development.md
- docs/deployment.md
- docs/git-workflow.md
- docs/engine-evaluation.md
- docs/troubleshooting.md

The product blueprint should preserve the product principles in this prompt. AGENTS.md should contain durable repository instructions for future Codex sessions, including:

- Read the relevant docs before making architectural changes.
- Keep learning, evaluation, scheduling, and content logic independent from React.
- Keep CodeMirror behind a thin exercise-oriented adapter.
- Correct results must not be rejected solely because their key sequence differs from a reference.
- No runtime AI, accounts, or backend in the MVP.
- Update documentation when behavior or setup changes.
- Run the comprehensive verification command before declaring work complete.
- Do not add exercise content without validation and executable reference-solution tests once that system exists.

## Local developer experience

Provide package scripts with clear names for:

- Development server.
- Lint.
- Type checking.
- Unit tests.
- Browser tests.
- Production build.
- Production preview.
- A comprehensive check command that runs the appropriate noninteractive verification suite.

README.md and docs/local-development.md must explain step by step:

1. Ubuntu prerequisites.
2. Selecting the expected Node version.
3. Installing dependencies.
4. Starting the local development server.
5. Opening the application.
6. Running each test category.
7. Building the production application.
8. Previewing the exact production build locally.
9. Common troubleshooting steps.

Assume the reader has limited Vite and GitHub Pages experience.

## Git and deployment design

Document and configure this simple workflow:

- main is the deployable production branch.
- Short-lived feature branches are used for nontrivial work.
- There is no permanent develop branch.
- Verification runs for pushes and pull requests.
- Only main deploys to GitHub Pages.
- Do not maintain a generated gh-pages branch manually.

Create GitHub Actions workflows for continuous integration and GitHub Pages deployment, but do not attempt to enable Pages remotely.

The Pages configuration must account for:

- Vite’s base path when hosted at username.github.io/repository-name.
- Local development at the root path.
- Hash-based application routing.
- Building to dist.
- Deploying the generated artifact only after verification succeeds.

docs/deployment.md must contain exact, current, numbered GitHub UI instructions for:

1. Creating or connecting the repository.
2. Pushing main.
3. Opening repository Settings.
4. Selecting Pages.
5. Choosing GitHub Actions as the publishing source.
6. Verifying the workflow and deployed URL.
7. Diagnosing common base-path or blank-page problems.

If the final base path depends on a repository name that is not yet known, make it configurable and document the one setting that must be supplied later. Do not invent a permanent repository name.

## Vim engine adapter

Create a thin adapter around CodeMirror and @replit/codemirror-vim. Keep it limited to needs we can validate now:

- Initialize the editor from text, cursor position, and optional selection.
- Focus the editor.
- Read document text, cursor, selection, and Vim mode when available.
- Subscribe to document, selection, and mode changes.
- Capture a normalized input trace if feasible.
- Reset editor and Vim state deterministically.
- Programmatically apply normalized Vim key tokens for reference demonstrations.
- Destroy the editor cleanly.

Do not create an elaborate universal editor abstraction. Record any capability the package cannot expose cleanly instead of disguising it.

## Engine feasibility laboratory

Add a clearly labeled laboratory route or screen. This is diagnostic developer UI, not the final product design.

It should provide:

- A CodeMirror Vim editor.
- Several selectable starting fixtures using C++, CMake, and shell text.
- Visible document, cursor, selection, and Vim mode information.
- A visible normalized key or interaction trace when feasible.
- Reset controls.
- A way to run or step through predefined reference sequences.
- A concise description of what each reference sequence is testing.
- A manual-results area or checklist for behaviors that cannot be fully automated.
- Clear indication that this is an engine experiment.

## Conformance matrix

Test representative behavior from these categories:

- Normal, Insert, and Visual modes.
- Basic and line-oriented movement.
- Word and line motions.
- Character-find motions.
- Counts.
- Operators composed with motions.
- Inner and around text objects.
- Undo and redo.
- Dot repeat.
- Search and next/previous match.
- Yank, delete, paste, and named registers.
- Marks.
- Macro recording and replay.
- Representative Ex substitution.
- At least one Ex command that is unsupported or intentionally intercepted by the host application.
- Exercise reset after registers, search, marks, macros, and undo history have been modified.
- Essential browser shortcut conflicts in Chrome and Firefox.

The point is not to claim full Vim compatibility. The point is to determine whether the features likely to appear in the initial curriculum behave correctly and are observable enough for teaching.

Create docs/engine-evaluation.md with a matrix containing:

- Capability.
- Expected real Vim behavior.
- Automated, manual, or not yet testable.
- Result.
- Evidence or test name.
- Known divergence.
- Curriculum consequence.

Do not mark uncertain behavior as passing.

## Testing requirements

Add:

- Unit tests for any pure adapter normalization or helper logic.
- Real-browser Playwright tests for representative Vim input and state.
- At least one Chromium project.
- A Firefox project if it runs dependably in this environment; otherwise configure it correctly and document the local prerequisite or current blocker.
- A test that resets or recreates the editor and checks for state leakage where technically possible.
- A production-build smoke test or equivalent check.

Avoid relying on jsdom for behavior that only a real CodeMirror browser instance can prove.

If browser binaries or sandbox restrictions prevent a test from running, do not remove the test merely to make CI green. Configure it appropriately, explain the blocker, and distinguish verified results from unverified ones.

## Product visual scope

Keep the UI clean and usable, but do not spend significant time on branding or final visual design. A restrained developer-tool aesthetic is sufficient.

The lab should work on an ordinary desktop Chrome window and remain usable at narrower desktop widths. Mobile support is out of scope.

## Completion criteria

This task is complete only when:

- Dependencies install from the lockfile.
- Type checking passes.
- Linting passes.
- Unit tests pass.
- Runnable browser tests pass.
- Production build passes.
- Production preview instructions are correct.
- The lab can be used manually.
- The engine evaluation clearly distinguishes proven capabilities, failures, and unknowns.
- CI and Pages workflows are present and structurally valid.
- Documentation is detailed enough for a GitHub Pages beginner on Ubuntu.

## Required final response

When finished, report:

1. A concise summary of what you created.
2. The important architectural decisions.
3. The exact commands you ran.
4. Every test/build result, including anything not run.
5. The CodeMirror Vim feasibility conclusion:
   - suitable,
   - suitable with bounded limitations,
   - or unsuitable for the planned curriculum.
6. Known limitations and risks.
7. The exact next manual steps I should take locally.
8. Whether the worktree is ready for me to review before an initial commit.

Do not begin implementing the learning curriculum or adaptive system after completing the laboratory. Stop and wait for review.
---
