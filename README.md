# The Maine Coon Journal

A photo journal built with [Eleventy](https://www.11ty.dev/). Each entry is a short text plus a gallery of photos.

```sh
npm install
npm run dev      # http://localhost:8080, rebuilds as you edit
npm run build    # clean production build into _site/
npm run deploy   # clean build, then upload _site/ to Cloudflare Pages (production)
```

## Deploying

`npm run deploy` publishes to https://mainecoonnz.pages.dev. It always rebuilds `_site/` from scratch and uploads it as a complete new deployment, so deleted entries and photos disappear from the live site too. Photos aren't in git, so deploys are made from this machine rather than by a Cloudflare git build.

`npm run deploy:preview` uploads a preview instead (https://preview.mainecoonnz.pages.dev) without touching the live site.

The Cloudflare Pages project name is set in one place, `config.pagesProject` in `package.json`. Details and known Wrangler problems are in `cloudflare.md`.

## Setting up your own copy

These steps take a fresh clone to a live site at `https://<your-name>.pages.dev`. You need Node.js 20 or later, git, and a free [Cloudflare account](https://dash.cloudflare.com/sign-up). You don't need to install Wrangler (Cloudflare's CLI) separately, because `npm install` provides it.

1. **Clone and install.**

   ```sh
   git clone https://github.com/ZL2ST/mainecoon-blog.git my-journal
   cd my-journal
   npm install
   ```

   npm warns that some install scripts (`esbuild`, `workerd`) aren't approved. Deploying doesn't need them, so ignore the warning.

2. **Make it yours.**
   - Edit `src/_data/site.js` (title, tagline, intro, Instagram, email) and `src/about.md`.
   - Remove the demo entries: `rm -rf src/entries/20*`. They're lorem ipsum, and their photos aren't in git, so a clone has the text but no pictures. You can also delete `DEMO_CREDITS.md`.
   - Put a home page image at `src/assets/hero.jpg`. The build works without one.
   - Add your first entry (see [Posting a new entry](#posting-a-new-entry)), then check it with `npm run dev` at http://localhost:8080.

3. **Choose a project name.** It becomes your address, `https://<name>.pages.dev`, and can't be changed later. Use lowercase letters, numbers and hyphens. Set it in `package.json`:

   ```json
   "config": {
     "pagesProject": "my-journal"
   },
   ```

4. **Log in to Cloudflare** (once per computer). This opens a browser to authorise Wrangler:

   ```sh
   npx wrangler login
   ```

5. **Create the Pages project** (once), using the same name:

   ```sh
   npx wrangler pages project create my-journal --production-branch=master --force
   ```

   - **Keep `--force`.** Without it, current Wrangler versions create a Cloudflare *Worker* instead of a Pages project. They also write a `wrangler.jsonc` file and change the `deploy` script in `package.json`. If that happens, see `cloudflare.md`.
   - **Keep `--production-branch=master`, even if your git branch is `main`.** It has to match `--branch=master` in the `deploy` script, and it's only a label on Cloudflare's side.
   - **Check the address it prints.** If the name is already taken on pages.dev, Cloudflare may give you a slightly different address.
   - Don't connect the project to GitHub in the Cloudflare dashboard. Photos aren't in git, so a Cloudflare build would publish a site with no photos.

6. **Deploy.**

   ```sh
   npm run deploy
   ```

   This builds the site and uploads `_site/`. It prints a unique deployment URL, and the site is live at `https://<name>.pages.dev`. On a brand-new project the pages.dev address can take a minute or two to start working. The first upload sends every photo, and later deploys only upload what changed.

7. **Check that nothing unexpected changed.** Run `git status`. There should be no `wrangler.jsonc` or `wrangler.toml`, and `package.json` should only have your `pagesProject` change.

After this, the routine is: add an entry, then `npm run deploy`. To use your own domain instead of pages.dev, open the Cloudflare dashboard and go to Workers & Pages → your project → Custom domains.

## Posting a new entry

1. `npm run new` (creates today's entry) or `npm run new 2026-09-24`.
   You can also create the folder `src/entries/2026-09-24/` with an `index.md` yourself.
2. Write your text in `index.md` (plain Markdown). A `title:` in the front matter is optional; without one the entry shows its date.
3. Drop your raw photos into the same folder. That's it.

```
src/entries/2026-09-24/
  index.md        <- committed to git
  IMG_0001.jpg    <- gitignored
  IMG_0002.jpg
```

- One entry per day: the folder name is the date.
- Photos appear in filename order. To change it, list the ones you want first under `order:`. Any photo you don't list follows in filename order, so you only list the ones you want to move:

  ```markdown
  ---
  order:
    - IMG_0042.jpg
    - IMG_0007.jpg
  ---
  ```

  Names are matched ignoring case. A name that doesn't match a photo is skipped with a warning in the build output.
- The entry's cover (shown on the home page and journal list) is the first photo in the gallery. To pick a different one, add `cover: IMG_0007.jpg` to the front matter.
- JPG, PNG, TIFF and WebP are accepted. Each photo gets a gallery thumbnail and a full-size JPEG (90% quality, longest side ≤ 2000px, never upscaled). EXIF rotation is respected.
- To edit an entry, add or remove photos, or change `index.md`. `npm run dev` picks up changes live, and `npm run build` regenerates everything.

## Where things live

| What | Where |
|---|---|
| Site name, intro, Instagram, email | `src/_data/site.js` |
| Home page hero image | `src/assets/hero.jpg` (gitignored) |
| About page | `src/about.md` |
| Journal entries per page (`size: 5`) | `src/blog/index.njk` |
| Layouts | `src/_includes/layouts/*.njk` |
| Styles | `src/css/style.css` |
| Image processing, gallery, date parsing | `eleventy.config.js` |

Photos are never committed. Back them up separately. Demo image sources are listed in `DEMO_CREDITS.md`.
