# Repository instructions

Read `docs/product-blueprint.md`, `docs/architecture.md`, and the relevant focused documentation before architectural changes.

- Keep learning, evaluation, scheduling, persistence, and content logic independent from React.
- Keep CodeMirror behind the thin, exercise-oriented adapter in `src/editor`.
- Evaluate correctness before strategy. Never reject a correct result solely because its key sequence differs from a reference.
- The MVP has no runtime AI, accounts, backend, telemetry, or paid service.
- Keep the prototype narrow and do not imply full Vim or Neovim compatibility.
- Update documentation whenever setup, architecture, behavior, or known compatibility changes.
- Run `npm run check` before declaring implementation work complete and report anything that could not run.
- Once exercises exist, do not add one without schema validation and executable reference solutions that satisfy its outcome rules.
- Preserve user changes. Do not commit, push, or alter remotes unless explicitly requested.
