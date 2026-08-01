# GitHub Pages deployment

The repository name is intentionally unknown. Local builds use `/`. The deployment workflow supplies `VITE_BASE_PATH=/<repository-name>/`; this is the only repository-specific build setting. Hash routing keeps application routes out of the server path.

## First publication

1. On GitHub, select **New repository**, enter the name you chose, do not initialize it with a README, and create it. Copy GitHub's commands for connecting an existing repository, but review before running them.
2. Locally, make the reviewed initial commit on `main`, add the repository as `origin`, and run `git push -u origin main`. None of these operations are performed by this prototype task.
3. Open the repository on GitHub and choose **Settings**.
4. In the left sidebar under **Code and automation**, choose **Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**. Do not select branch deployment and do not create `gh-pages`.
6. Open the **Actions** tab. Confirm **Verify** succeeds and **Deploy GitHub Pages** completes for `main`. Its deployment job and repository **Deployments** area show the published URL, normally `https://username.github.io/repository-name/`.
7. Open that URL, then open `/#/lab`, exercise the editor, and reload the page.

The Pages workflow verifies first, builds `dist` with the repository base path, uploads only that artifact, and deploys using GitHub's official Pages actions. Repository settings may ask you to approve the `github-pages` environment on the first run.

## Diagnosing a blank page

Open browser developer tools and inspect Network. Asset 404s whose URLs omit the repository name indicate a wrong base. Confirm the build step received `VITE_BASE_PATH: /${{ github.event.repository.name }}/` and that Vite's `base` remains `process.env.VITE_BASE_PATH || '/'`. A doubled repository name means a manual base was added elsewhere; remove it. A direct route must remain after `#` because Pages does not rewrite arbitrary paths. Check Actions logs before rerunning, and confirm Pages still lists GitHub Actions as its source.

For a user/organization site named exactly `username.github.io`, change the workflow deployment value to `/`; that special repository publishes at the domain root.
