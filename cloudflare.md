# Cloudflare Pages hosting

The site is hosted on Cloudflare Pages at <https://mainecoonnz.pages.dev>. (It was previously trialled on Netlify at mainecoonnz.netlify.app. That's been removed from the repo, though the Netlify site itself may still exist in their dashboard.)

## Setup

First-time setup for a new copy (new project name and pages.dev address) is written up step by step in `README.md` under "Setting up your own copy". This file covers how this site's own project is set up.


- **Project:** `mainecoonnz` (set once in `package.json` as `config.pagesProject`, which both deploy scripts read), a **Direct Upload** project with production branch `master`. It was created with `npx wrangler pages project create mainecoonnz --production-branch=master --force`. Without `--force`, Wrangler 4.14x creates a **Worker** instead ("Pages is now part of Workers"). `--force` is only needed when creating the project. Now that it exists, `wrangler pages deploy` goes straight to Pages.
- **CLI:** `wrangler` is a devDependency, so `npx wrangler …` uses the project's copy and nothing needs a global install. npm warns that the `esbuild` and `workerd` install scripts aren't approved. Pages uploads don't need either, so ignore the warning.
- **Auth:** run `npx wrangler login` once per machine. It opens a browser and stores an OAuth token in the user's home directory, not in the repo. `npx wrangler whoami` shows the account.
- **`.wrangler/`** (the CLI's local state folder) is gitignored.
- **Never connect the project to git.** Photos aren't in git, so a Cloudflare git build would publish a site with no photos. (A Direct Upload project can't be switched to git integration later anyway.)

## Deploying

```sh
npm run deploy           # production
npm run deploy:preview   # preview only
```

These run:

```sh
npm run build && wrangler pages deploy _site --project-name=$npm_package_config_pagesProject --branch=master --commit-dirty=true
```

- `npm run build` deletes `_site/` and rebuilds it from scratch.
- `--branch=master` matches the production branch, so the deployment goes live. Any other branch name makes a **preview deployment**: `deploy:preview` uses `--branch=preview`, which is served at <https://preview.mainecoonnz.pages.dev> as well as a unique `https://<hash>.mainecoonnz.pages.dev` URL. The live site doesn't change.
- `--commit-dirty=true` silences the warning about uncommitted changes. Wrangler records the git commit in the deployment metadata, but it uploads `_site/` whatever git's state is.

## How adds, edits and deletions reach the site

Each Pages deployment is a **complete snapshot** of `_site/`. Anything missing from the new `_site/` isn't served by the new deployment, so deleted entries and photos disappear without any extra step.

Uploads are incremental. Wrangler hashes every file and uploads only the ones Cloudflare doesn't already have for the project. Processed images have content-hashed names, so re-deploying an unchanged photo costs nothing.

Old deployments stay reachable at their unique `<hash>.mainecoonnz.pages.dev` URLs. List them with `npx wrangler pages deployment list --project-name=mainecoonnz`, and delete them in the dashboard (Workers & Pages → mainecoonnz → Deployments) if a removed photo must be gone completely.

## Wrangler gotchas (learned 2026-09-28)

- **There must be no `wrangler.jsonc` / `wrangler.toml` in the repo.** When Wrangler reroutes a command to Workers, it generates one (named after the package, `maincoon-blog`). While that file exists, `wrangler pages deploy` deploys a Worker instead of the Pages project.
- **The same rerouting also edits the repo.** It rewrote the `deploy` script in `package.json` to `wrangler deploy`, added a `preview` script, and appended `.dev.vars*`/`.env*` rules to `.gitignore`. If wrangler ever prints `https://<name>.zl2st.workers.dev` instead of a `*.mainecoonnz.pages.dev` URL, check `git diff`, delete the generated config, and remove the Worker with `npx wrangler delete --name <name>`.
- **`src/404.md` (output `/404.html`) must stay.** When a deployment has no `404.html`, Pages treats the site as a single-page app and serves the home page with status 200 for every unknown URL, including deleted entries. With the page, those URLs return a 404. Cloudflare's edge can keep serving an old 200 response for a URL that was requested before a deploy, so test with URLs that haven't been requested yet.

## Verification (2026-09-28)

After the first production deploy, all 200 files in a clean local build were fetched from https://mainecoonnz.pages.dev and matched by SHA-1. HTML pages were checked at their clean URLs, because `/x/index.html` returns a 308 redirect to `/x/`. A second deploy with no changes uploaded 0 files.

## Limits (free plan)

20,000 files per deployment, 25 MiB per file, and 500 builds a month (direct uploads count). The site is roughly 200 files and 72 MB, with photos at most a few MB each, so it's well within these.
