# The Maine Coon Journal

A photo journal built with [Eleventy](https://www.11ty.dev/). Each entry is a short text plus a gallery of photos.

```sh
npm install
npm run dev      # http://localhost:8080, rebuilds as you edit
npm run build    # clean production build into _site/
```

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
