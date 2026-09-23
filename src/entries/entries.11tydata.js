// Applies to every src/entries/YYYY-MM-DD/index.md
export default {
  layout: "layouts/entry.njk",
  eleventyComputed: {
    permalink: (data) => `/blog/${data.page.filePathStem.split("/").at(-2)}/`,
    pageTitle: (data) => data.title || data.page.filePathStem.split("/").at(-2),
  },
};
