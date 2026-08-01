# Git workflow

`main` is always deployable. Use short-lived branches such as `feature/editor-reset` for nontrivial changes and open pull requests when review is useful. There is no permanent `develop` branch.

Before committing, run `npm run check`, inspect `git diff`, and avoid committing generated `dist`, reports, or `node_modules`. Pushes and pull requests run CI. A verified push to `main` triggers Pages deployment. GitHub Actions publishes the artifact directly; never create or manually maintain a `gh-pages` branch.

This prototype was intentionally created without a commit or remote. Repository creation and the initial commit remain owner review steps.
