# ReactPress for VS Code

Publish Companion for [ReactPress](https://www.reactpress.cc/) — write Markdown in your repo, preview on your theme, push/publish without opening `/admin`.

Monorepo path: `extensions/vscode/`

## Packages

| Path | Package | Role |
| --- | --- | --- |
| [`packages/content`](./packages/content) | `@fecommunity/reactpress-content` | Shared auth, markdown→html/toc, pull/push/publish |
| [`packages/cli`](./packages/cli) | `@fecommunity/reactpress-content-cli` | `reactpress-content` CLI |
| [`packages/extension`](./packages/extension) | `reactpress-vscode` | VS Code / Cursor extension |

## Develop

```bash
cd extensions/vscode
pnpm install
pnpm build
```

### CLI

```bash
pnpm cli -- login --api http://localhost:3002/api --user admin --password admin --save-token
pnpm cli -- new "Hello ReactPress"
pnpm cli -- push ./content/posts/hello-reactpress.md
pnpm cli -- publish ./content/posts/hello-reactpress.md
```

### Extension

1. Open the `extensions/vscode` folder as the workspace root (so `.vscode/launch.json` applies)
2. `pnpm install && pnpm build` — or keep `pnpm watch` running while iterating (`content` + extension)
3. Press **F5** / **Run Extension**, or install a VSIX via `pnpm package:vsix`
4. Command Palette → **ReactPress: Connect Site** (default API `http://localhost:3002/api`; NestJS admin credentials, typically `admin` / `admin`)

## Local Markdown shape

```md
---
title: My Post
status: draft
summary: ""
cover: ""
category: architecture
tags: [reactpress]
isCommentable: true
---

# My Post

Body in Markdown.
```

After the first successful push, `id` and `updatedAt` are written back into frontmatter.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `reactpress.apiUrl` | `http://localhost:3002/api` | API base (include `/api`) |
| `reactpress.siteUrl` | `http://localhost:3001` | Visitor site for preview |
| `reactpress.contentPath` | `content/posts` | Local posts folder |
| `reactpress.username` | `""` | Username only; token in SecretStorage |

Marketplace listing README lives in [`packages/extension/README.md`](./packages/extension/README.md).

## Scope (v0.1)

Included: connect, new article, push draft, publish, pull, theme preview URL, image upload command, CodeLens, status bar.

Not included: knowledge base, CMS pages, Admin webview editor, full media library UI, paste-image auto-upload.

## Quality gate

```bash
pnpm test        # core kit UT (1000+ scenarios) + c8 coverage gate (100%)
pnpm typecheck
pnpm build
pnpm package:vsix
```

See [PRODUCTION.md](./PRODUCTION.md) for Marketplace publish steps. The extension ships as **preview** until live API E2E and Extension Host smoke pass on your machine.
