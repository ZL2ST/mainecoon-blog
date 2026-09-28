# Mac Setup for the Blog (Apple Silicon)

This guide sets up a fresh Mac (M1/M2/M3 or later) to write entries for the blog and publish it to Cloudflare Pages. It only needs to be done once. After that, see [Daily workflow](#daily-workflow).

The site is hosted on Cloudflare Pages, in a project you create in step 5, at `https://<your-project>.pages.dev`. The site is built on the Mac and the finished files are uploaded from there. Cloudflare never builds anything itself, because the photos only exist on your computer.

---

## Part 1: One-time setup

All commands are run in **Terminal** (Applications → Utilities → Terminal).

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

On Apple Silicon, Homebrew installs to `/opt/homebrew`, which is not on the PATH by default. The installer prints **"Next steps"** at the end. Run those commands. They are typically:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Install Node.js

Install Node 24, the version the blog is built and tested with. Use `node@24` rather than plain `node`: plain `node` always installs the newest major release (26 at the time of writing).

```bash
brew install node@24
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zprofile
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
```

Homebrew doesn't put versioned formulas like `node@24` on the PATH, so the second line adds it for every new Terminal window. The third line adds it for the current one.

Check that it worked with `node -v`. It should print `v24.x.x`.

### 3. Put the blog folder in place

Put the project folder at `~/Sites/mainecoon-blog`. Get it either by downloading the ZIP from GitHub (**Code → Download ZIP**, then unzip it; it unzips as `mainecoon-blog-master`, so rename the folder to `mainecoon-blog`) or by copying it from another computer. If you copy it, leave out the `node_modules` and `_site` folders. They're recreated in the next step and don't work when copied between machines.

The GitHub ZIP contains the entry text but **no photos**. Copy the photos into their entry folders from your backup (see [Backing up](#backing-up)) before you publish. Otherwise the next deploy will publish those entries without their pictures.

Keep the folder in `~/Sites`, **not** in Desktop, Documents or a Dropbox/iCloud folder. Syncing services choke on the thousands of files in `node_modules`. See [Backing up](#backing-up) for how to protect your entries instead.

### 4. Install the dependencies and log in to Cloudflare

```bash
cd ~/Sites/mainecoon-blog
npm ci
npx wrangler login
```

- `npm ci` installs the exact dependency versions the project uses, including Wrangler (Cloudflare's command-line tool). It may warn that some install scripts (`esbuild`, `workerd`) aren't approved. Ignore that: publishing doesn't need them.
- `npx wrangler login` opens the browser. Log in to your Cloudflare account (sign up for a free one at https://dash.cloudflare.com/sign-up if needed) and click **Allow**. This only needs doing once per Mac.

### 5. Create your Cloudflare Pages project

This is done once. The project name becomes the site's address, `https://<name>.pages.dev`, and can't be changed later. Use lowercase letters, numbers and hyphens, for example `my-journal`.

1. **Tell the blog which project to publish to.** This sets `config.pagesProject` in `package.json`, which the deploy commands read:

   ```bash
   npm pkg set config.pagesProject=my-journal
   ```

   Use this command rather than editing `package.json` in TextEdit. TextEdit can turn the file's straight quotes into curly ones, which breaks it.

2. **Create the project on Cloudflare,** using the same name:

   ```bash
   npx wrangler pages project create my-journal --production-branch=master --force
   ```

   - **Keep `--force`.** Without it, Wrangler creates a Cloudflare *Worker* instead of a Pages project, adds a `wrangler.jsonc` file and changes the deploy command in `package.json`.
   - **Keep `--production-branch=master` exactly as written.** It must match the deploy command.
   - **Check the address it prints.** If the name is already taken on pages.dev, Cloudflare may give you a slightly different address.
   - In the Cloudflare dashboard, **don't connect the project to GitHub.** The photos aren't on GitHub, so a Cloudflare build would publish the site without them.

### 6. Test it

```bash
npm run dev
```

Open http://localhost:8080. If the blog appears, setup is done. Press **Ctrl + C** in Terminal to stop the preview.

The site isn't online until the first `npm run deploy` (step 5 of the daily workflow). On a brand-new project, the pages.dev address can take a minute or two to start working after that first deploy.

---

## Daily workflow

Always start in the blog folder:

```bash
cd ~/Sites/mainecoon-blog
```

1. **Start the preview:** run `npm run dev` and open http://localhost:8080. The page refreshes by itself as you save text or add and remove photos. Leave it running, and open a second Terminal window (**Cmd + N**) for the commands below.
2. **Create an entry:**

   ```bash
   cd ~/Sites/mainecoon-blog
   npm run new                  # today's date
   npm run new 2026-10-02       # or a specific date
   ```

3. **Write:** open the text in TextEdit, or any plain-text editor:

   ```bash
   open -e src/entries/2026-10-02/index.md
   ```

4. **Add photos:** open the entry's folder in Finder with `open src/entries/2026-10-02` and drag your photos in. JPEG, PNG, TIFF and WebP all work; there's no need to resize anything. See `README.md` for choosing the cover and photo order.
5. **Publish:** stop the preview (**Ctrl + C**), then run:

   ```bash
   npm run deploy
   ```

   It ends with **"Deployment complete!"** and a link. The site at `https://<your-project>.pages.dev` updates within a few seconds. The first deploy uploads every photo. After that only new or changed photos are uploaded, so it's quick.

To try something out without changing the live site, run `npm run deploy:preview` instead. It publishes to `https://preview.<your-project>.pages.dev`.

---

## Backing up

The photos and entry text only exist on this Mac, so back up the entries regularly:

- **Back up `src/entries/`.** It holds every entry's text and original photos.
- **Also back up `src/assets/`,** which holds the home page hero image.

Everything else can be recreated: `node_modules` by `npm ci`, and `_site` by every build.

Copy these folders to Dropbox or a similar service, or point your backup tool at them. Don't move the whole project into Dropbox (see step 3).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: brew` | Rerun the "Next steps" commands from step 1, then reopen Terminal. |
| `command not found: node` or `npm`, or `node -v` isn't 24 | Redo step 2 (including the `echo … >> ~/.zprofile` line), then reopen Terminal. |
| `brew` warns that `node@24` is deprecated | Homebrew plans to retire it on 2027-04-30. Switch to the next long-term release (`node@26`) by redoing step 2 with `26` in place of `24`, then run `npm ci`. |
| `npm run dev` errors after updating the project files | Dependencies may have changed. Run `npm ci`. |
| Deploy asks you to log in, or says "not authenticated" | Run `npx wrangler login` again. |
| Deploy says the project can't be found | The name set with `npm pkg set` doesn't match the project you created in step 5. Check both with `npm pkg get config.pagesProject` and `npx wrangler pages project list`. |
| Deploy prints an address ending in **`workers.dev`**, or a `wrangler.jsonc` file appears in the folder | Wrangler has published to the wrong kind of Cloudflare project. This usually means the project was created without `--force` in step 5. Stop, don't deploy again, and ask for help (see "Wrangler gotchas" in `cloudflare.md`). |
| A photo from an iPhone doesn't show up | iPhone photos are often **HEIC**, which isn't supported. Export them as JPEG (in Photos: **File → Export**, JPEG) and use those. |
| The live site still shows an old page | Reload with **Cmd + Shift + R**. The deploy link printed at the end always shows the newest version. |
