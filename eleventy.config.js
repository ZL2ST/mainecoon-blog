import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import Image from "@11ty/eleventy-img";
import { DateTime } from "luxon";

const IMAGE_EXT = /\.(jpe?g|png|tiff?|webp)$/i;
const FULL_MAX = 2000; // longest side of the full-size image
const THUMB_MAX = 800; // longest side of the gallery thumbnail
const ENTRY_DATE = /entries\/(\d{4}-\d{2}-\d{2})\//;

// Width that makes the longest side `max` px, never upscaling.
function widthForLongestSide(w, h, max) {
  const scale = Math.min(1, max / Math.max(w, h));
  return Math.round(w * scale);
}

// Process one raw image into a thumbnail + full-size JPEG.
async function processImage(src, outSubdir) {
  const meta = await sharp(src).metadata();
  const rotated = meta.orientation >= 5 && meta.orientation <= 8;
  const w = rotated ? meta.height : meta.width;
  const h = rotated ? meta.width : meta.height;

  const thumbW = widthForLongestSide(w, h, THUMB_MAX);
  const fullW = widthForLongestSide(w, h, FULL_MAX);

  const stats = await Image(src, {
    widths: [...new Set([thumbW, fullW])],
    formats: ["jpeg"],
    sharpJpegOptions: { quality: 90 },
    outputDir: path.join("_site/img", outSubdir),
    urlPath: `/img/${outSubdir}/`,
  });
  const [thumb, full = thumb] = stats.jpeg;
  return { thumb, full, ratio: (w / h).toFixed(4) };
}

// Warnings print once per build (cover/gallery run on several pages per entry).
const warned = new Set();
function warnOnce(msg) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[mainecoon] ${msg}`);
}

// Filename in `files` matching `name`, ignoring case (IMG_0001.JPG vs img_0001.jpg).
function findImage(files, name) {
  const lower = String(name).toLowerCase();
  return files.find((f) => f.toLowerCase() === lower);
}

// Raw images in an entry folder: names from the optional `order:` list first,
// then everything else in natural filename order. Unknown names warn and are skipped.
function imagesIn(dir, order) {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const first = [];
  for (const name of [].concat(order ?? [])) {
    const match = findImage(files, name);
    if (!match) warnOnce(`order: "${name}" not found in ${dir}, skipping it`);
    else if (!first.includes(match)) first.push(match);
  }
  return [...first, ...files.filter((f) => !first.includes(f))].map((f) => path.join(dir, f));
}

function entrySlug(inputPath) {
  return path.basename(path.dirname(inputPath));
}

function thumbImg(img, alt = "") {
  return `<img src="${img.thumb.url}" width="${img.thumb.width}" height="${img.thumb.height}" alt="${alt}" loading="lazy" decoding="async">`;
}

export default function (eleventyConfig) {
  // Entry date comes from its folder name: src/entries/YYYY-MM-DD/index.md
  eleventyConfig.addDateParsing(function (dateValue) {
    if (dateValue) return; // explicit front matter date wins
    const m = this.page.inputPath.match(ENTRY_DATE);
    if (m) return DateTime.fromISO(m[1], { zone: "utc" });
  });

  eleventyConfig.addCollection("entries", (api) =>
    api.getFilteredByGlob("src/entries/*/index.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.on("eleventy.before", () => warned.clear());

  // Justified thumbnail grid for the current entry; clicking opens the lightbox.
  eleventyConfig.addShortcode("gallery", async function (order) {
    const dir = path.dirname(this.page.inputPath);
    const slug = entrySlug(this.page.inputPath);
    const images = await Promise.all(imagesIn(dir, order).map((src) => processImage(src, slug)));
    if (!images.length) return "";
    const items = images
      .map(
        (img) =>
          `<a href="${img.full.url}" data-pswp-width="${img.full.width}" data-pswp-height="${img.full.height}" style="--ar:${img.ratio}">${thumbImg(img)}</a>`
      )
      .join("\n");
    return `<div class="gallery">\n${items}\n<i></i></div>`;
  });

  // Entry cover thumbnail (archive + home page): the `cover:` front matter file,
  // else the first image in gallery order.
  eleventyConfig.addShortcode("cover", async function (inputPath, cover, order) {
    const dir = path.dirname(inputPath);
    const images = imagesIn(dir, order);
    let src = cover && images.find((f) => path.basename(f).toLowerCase() === String(cover).toLowerCase());
    if (cover && !src) warnOnce(`cover: "${cover}" not found in ${dir}, using the first image instead`);
    src ||= images[0];
    if (!src) return "";
    return thumbImg(await processImage(src, entrySlug(inputPath)));
  });

  // Single image from src/assets (e.g. the home page hero).
  eleventyConfig.addShortcode("image", async function (file, alt = "") {
    const src = path.join("src/assets", file);
    if (!fs.existsSync(src)) return "";
    const img = await processImage(src, "assets");
    return `<img src="${img.full.url}" width="${img.full.width}" height="${img.full.height}" alt="${alt}">`;
  });

  eleventyConfig.addFilter("readableDate", (date) =>
    DateTime.fromJSDate(date, { zone: "utc" }).toFormat("d LLLL yyyy")
  );
  eleventyConfig.addFilter("isoDate", (date) =>
    DateTime.fromJSDate(date, { zone: "utc" }).toISODate()
  );
  // Plain-text excerpt from the entry's markdown source: first paragraph, trimmed.
  // Reads the file rather than rendered content so listing pages never depend on render order.
  eleventyConfig.addFilter("excerpt", (inputPath, length = 220) => {
    const md = fs.readFileSync(inputPath, "utf8").replace(/^---[\s\S]*?\n---\s*/, "");
    const para = (md.trim().split(/\n\s*\n/)[0] || "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links/images -> text
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return para.length > length ? para.slice(0, length).replace(/\s+\S*$/, "") + "…" : para;
  });

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy({ "node_modules/photoswipe/dist/photoswipe.css": "vendor/photoswipe.css" });
  eleventyConfig.addPassthroughCopy({ "node_modules/photoswipe/dist/photoswipe.esm.min.js": "vendor/photoswipe.esm.min.js" });
  eleventyConfig.addPassthroughCopy({ "node_modules/photoswipe/dist/photoswipe-lightbox.esm.min.js": "vendor/photoswipe-lightbox.esm.min.js" });

  // Adding/removing photos triggers a rebuild while `npm run dev` runs.
  // Photos are gitignored, and Eleventy's watcher skips gitignored files by default.
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addWatchTarget("src/entries/");
  eleventyConfig.addWatchTarget("src/assets/");

  // Eleventy doesn't rebuild when a file is deleted, so in dev mode watch for
  // deletions ourselves and poke a watched file to trigger a rebuild.
  if (process.env.ELEVENTY_RUN_MODE === "serve" && !globalThis.__deleteWatcher) {
    const trigger = ".cache/rebuild-trigger";
    fs.mkdirSync(".cache", { recursive: true });
    fs.writeFileSync(trigger, "");
    globalThis.__deleteWatcher = fs.watch("src", { recursive: true }, (event, file) => {
      if (event === "rename" && file && !fs.existsSync(path.join("src", file))) {
        fs.writeFileSync(trigger, String(Date.now()));
      }
    });
    // Eleventy's Ctrl+C handler only closes its own watchers and then waits for the
    // process to go idle, so close ours too or `npm run dev` never exits.
    process.once("SIGINT", () => globalThis.__deleteWatcher.close());
  }
  eleventyConfig.addWatchTarget(".cache/rebuild-trigger");

  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
