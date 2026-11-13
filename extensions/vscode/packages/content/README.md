# `@fecommunity/reactpress-content`

Shared ReactPress publish kit used by the VS Code extension and CLI.

- `ReactPressClient` — login, articles, categories/tags, file upload
- `parseLocalDocument` / `serializeLocalDocument` — Markdown + frontmatter
- `renderMarkdown` — html + toc (aligned with ReactPress server `markdown.util`)
- `pushFile` / `publishFile` / `pullArticleToFile` — sync with conflict detection

## Test

```bash
pnpm test
```

Runs the core kit unit suite (HTTP, client, frontmatter, markdown, sync) against an in-process mock API, with a **c8 coverage gate of 100%** (`lines` / `branches` / `functions` / `statements`).
