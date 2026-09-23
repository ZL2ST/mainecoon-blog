# Netlify demo hosting

The site is currently demoed on Netlify at <https://mainecoonnz.netlify.app>. This is a trial: final hosting (Netlify or Cloudflare Pages) hasn't been decided, so these notes live here rather than in `CLAUDE.md`.

## Setup

- **Site:** `mainecoonnz` on the Netlify account zl2st@pm.me ("ZL2ST's team"). The site was created in the Netlify dashboard beforehand.
- **CLI:** `netlify-cli` is a devDependency, so `npx netlify …` uses the project's copy and nothing needs a global install.
- **Auth:** run `npx netlify login` once per machine. It opens a browser and stores a token in the user's home directory, not in the repo.
- **No linking:** the deploy script names the site with `--site=mainecoonnz`, so `netlify link` isn't needed. `netlify status` warns that the folder isn't linked; ignore that.
- **`.netlify/`** (the CLI's local state folder) is gitignored.

## Deploying

```sh
npm run deploy
```

This runs:

```sh
npm run build && netlify deploy --prod --no-build --dir=_site --site=mainecoonnz
```

- `npm run build` deletes `_site/` and rebuilds it from scratch.
- `--no-build` stops the CLI from running a build of its own. Photos aren't in git, so the site must be built on this machine, never by Netlify. Don't connect the Netlify site to the git repo for automatic builds: they would publish a site with no photos.
- `--prod` publishes straight to the live URL. Without it you get a **draft deploy**: a full copy of the site at its own `https://<id>--mainecoonnz.netlify.app` URL, which doesn't change the live site. That's useful for previews:

  ```sh
  npm run build && npx netlify deploy --no-build --dir=_site --site=mainecoonnz
  ```

## How adds, edits and deletions reach the site

Each Netlify deploy is a **complete snapshot** of `_site/`, not a merge with the previous deploy. Anything missing from the new `_site/` is no longer served. Deleted entries and photos disappear without any extra step.

Uploads are incremental anyway. The CLI hashes every file, and Netlify requests only the files it hasn't stored yet. Processed images have content-hashed names, so re-deploying an unchanged photo costs nothing. A photo that also appears in another entry isn't uploaded twice either.

## Verification (2026-09-24)

After the first production deploy, the live site's file list (`netlify api listSiteFiles`) matched a local clean build file for file (193 files, same SHA-1s).

Then I made a temporary entry `2026-09-20` locally, built it, and draft-deployed each step. The live site was never changed.

| Step | Files uploaded | Checked on the draft URL |
|---|---|---|
| Add an entry (text + 2 photos) | 8 | Entry page, both images, and home/Journal links return 200; the live site still returns 404 for the entry |
| Edit the text, delete 1 photo | 3 | New text shows; both sizes of the deleted photo return 404, and the page doesn't reference them |
| Delete the entry | 0 | Entry page and its remaining images return 404; the home page no longer links to it |

The test drafts were then deleted from the deploy history (`npx netlify api deleteDeploy --data '{"deploy_id":"<id>"}'`; list deploys with `listSiteDeploys`).

## Quirks

- **Lowercase paths in the API.** `listSiteFiles` reports every path in lowercase. Netlify serves paths case-insensitively, so mixed-case image URLs such as `/img/…/okUdGyaJDP-800.jpeg` still return 200. When comparing local and live file lists, lowercase the local paths first.
- **`/netlify.toml` in deploys.** The CLI adds a generated `netlify.toml` to each deploy's file list. It isn't in `_site/`, and requesting it returns 404, so it isn't exposed.
- **npm install warning.** Installing `netlify-cli` prints an "allow-scripts" warning about its own nested `sharp@0.34`. The site's `sharp` (0.35) is separate and unaffected.

## If we move to Cloudflare Pages

The same model applies: build locally, then upload `_site/` (e.g. `wrangler pages deploy _site`). To remove Netlify, drop the `deploy` script and the `netlify-cli` devDependency, and delete `.netlify/` from `.gitignore`.
