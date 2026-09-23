// Usage: npm run new [YYYY-MM-DD]   (defaults to today)
// Creates src/entries/<date>/index.md — then drop photos into that folder.
import fs from "node:fs";
import path from "node:path";

const date = process.argv[2] || new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
  console.error(`Invalid date "${date}". Use YYYY-MM-DD.`);
  process.exit(1);
}

const dir = path.join("src/entries", date);
const file = path.join(dir, "index.md");
if (fs.existsSync(file)) {
  console.error(`Entry already exists: ${file}`);
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  file,
  `---
# title: Optional title
# cover: IMG_0001.jpg   (optional; defaults to the first photo)
---

Write your journal entry here.
`
);
console.log(`Created ${file}\nAdd photos to ${dir}/ and they'll appear in the gallery.`);
