# The Maine Coon Journal: Eleventy photo journal

The repo and package are `maincoon-blog`. The displayed site title comes from `src/_data/site.js`.

A personal photo blog. Each entry is a short journal text (little or no styling) plus a gallery of one or more photos, mostly high-contrast black and white. **The overriding goal is low-effort posting:** the owner creates a dated folder, writes `index.md`, drops in raw photos, and the build does everything else. Don't add steps, required front matter or manual image handling to that workflow.

User-facing usage (posting, covers, where settings live) is in `README.md`. Keep it in sync when behaviour changes.

## Commands

```sh
npm run dev      # eleventy --serve on :8080, live rebuild incl. photo add/remove
npm run build    # rm -rf _site && eleventy (clean build, so deleted photos don't linger)
npm run new [YYYY-MM-DD]   # scaffold src/entries/<date>/index.md (defaults to today)
```

Node and npm are installed via NVM. Eleventy v3 (ESM config), `@11ty/eleventy-img` (sharp) and PhotoSwipe v5 are all in `package.json`.

## Requirements (from the original spec)

- **Entries:** `src/entries/YYYY-MM-DD/index.md` plus raw photos in the same folder. At most **one entry per day**; the folder name is the date. Titles are optional (the date is shown instead).
- **Editing:** add or remove photos in the folder, or edit `index.md`. The build handles the rest.
- **Git:** entry text goes into git. **Raw and processed images must never be committed** (see `.gitignore`: case-insensitive image patterns under `src/entries/` and `src/assets/`, plus `_site/`).
- **Images:** the owner shoots **2:3** (portrait or landscape). Full-size output is at most **2000px on the longest side**, JPEG at **90% quality**, never upscaled. The code must not assume 2:3; it uses each image's real aspect ratio.
- **Galleries:** typically fewer than 30 images. Clicking a thumbnail opens a lightbox; **arrow keys** move between images (PhotoSwipe also gives swipe, zoom and Esc).
- **Formats:** Markdown for content, Nunjucks (`.njk`) for layouts.
- **Targets:** desktop and mobile browsers; JavaScript is available.
- **Accessibility:** explicitly out of scope. The site is designed for sighted users with full colour vision, so don't spend effort on it unless asked.
- **Design:** modern and minimal, few colours so the B&W photos carry the page. There's a landing page (title, intro, one hero image, easy access to the latest entry), a paginated Journal listing and an About page.

## Decisions made with the owner

- Entry text and photos share one folder per entry, rather than living in separate trees.
- Entry page: text first, then a justified thumbnail grid (CSS-only: `flex-grow`/basis from `--ar`), then older/newer links.
- **White theme only.** There's deliberately no dark mode, and the lightbox is white too. Thumbnails get a faint `--edge` outline so pale skies don't dissolve into the page.
- **Gallery order:** natural filename order by default. Optional `order:` front matter (a list or a single name) puts those photos first and the rest follow in filename order. It's a partial list on purpose, so newly added photos can never be hidden. Names match case-insensitively; unknown names warn once per build and are skipped.
- **Covers:** optional `cover: <filename>` front matter, defaulting to the first photo in gallery order (so `order:` also sets the cover). Covers on the Journal list and home page are **resized, never cropped** (max-height cap for portraits).
- Journal pagination: **5 entries per page** (`size` in `src/blog/index.njk`). URLs are `/blog/`, then `/blog/page/N/`.
- Entry URLs: `/blog/YYYY-MM-DD/`.

## Architecture

- `eleventy.config.js` holds all the logic:
  - `addDateParsing`: the entry date comes from the folder name.
  - `entries` collection: newest first.
  - `processImage`: works out widths so the longest side is at most 2000 (thumb at most 800), accounting for EXIF orientation; eleventy-img bakes in the rotation.
  - `imagesIn(dir, order)`: the single source of photo order, shared by the gallery and cover.
  - Shortcodes `{% gallery order %}`, `{% cover inputPath, cover, order %}` and `{% image file, alt %}` (for `src/assets/`).
  - Filters `readableDate`, `isoDate` and `excerpt`.
- `src/entries/entries.11tydata.js`: layout, permalink and `pageTitle` for every entry.
- `src/_data/site.js`: site name, tagline, intro, hero image, Instagram, email.
- `src/_includes/layouts/{base,entry}.njk`, `src/index.njk` (home), `src/blog/index.njk` (paginated Journal) and `src/about.md`.
- `src/css/style.css` (theme tokens on `:root`) and `src/js/gallery.js` (PhotoSwipe init). PhotoSwipe files are passthrough-copied from `node_modules` to `/vendor/`.
- Processed images go to `_site/img/<entry-date>/` with content-hashed names.

## Gotchas (learned the hard way; don't regress these)

- **Excerpts read the Markdown source file**, not `entry.content`. Using rendered content on the home or Journal pages causes `TemplateContentPrematureUseError` on incremental rebuilds when a new entry is added.
- **`setUseGitIgnore(false)` is required.** Eleventy's watcher ignores gitignored paths, which is every photo, so the dev server wouldn't notice photo changes. Images aren't templates, so disabling it is safe.
- **Eleventy v3 doesn't rebuild on file deletion.** In serve mode a recursive `fs.watch` on `src/` touches `.cache/rebuild-trigger` (a watch target) when a file disappears.
- **That watcher must be closed on SIGINT.** Eleventy's Ctrl+C handler only closes its own watchers and waits for the event loop to drain, so without this `npm run dev` never exits. `.unref()` does *not* work for recursive `fs.watch` on Linux.
- PhotoSwipe's CSS loads after `style.css`, so lightbox theme overrides need higher specificity (`html .pswp`).
- Output heights can be 1999 rather than 2000 because of rounding. That's intended: never exceed 2000.

## Verifying changes

- `npm run build`, then check every file in `_site/img/**` is JPEG with its longest side at most 2000 (a quick sharp metadata loop).
- Headless `chromium` is installed. Use `--screenshot` for layout checks, and the DevTools protocol (`--remote-debugging-port`) to test the lightbox (click, ←/→, Esc) or emulate dark mode.
- To check the gitignore, `git add -A --dry-run` must list no image files.
- When stopping test servers, kill by PID. `pkill -f <pattern>` can match the invoking shell's own command line.

## Demo content

The demo entries (July–September 2026) are lorem ipsum with sample titles. Their photos are 10 public-domain Ansel Adams / NARA images, centre-cropped to 2:3 and duplicated across entries (sources in `DEMO_CREDITS.md`). The About page has a fake Instagram (`mainecoon.photos`) and email (`hello@mainecoon.example`), set in `site.js`.

## To do later

- Hosting on **Cloudflare Pages** (build `npm run build`, output `_site`). Note that photos aren't in git, so a git-triggered CI build has no images. Deploy will likely need to upload a locally built `_site` (e.g. `wrangler pages deploy _site`) or use some other image store. Decide with the owner. A Netlify demo is currently set up (`npm run deploy`); see `netlify.md`.
