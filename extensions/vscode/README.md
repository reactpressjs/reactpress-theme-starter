# ReactPress for VS Code

Publish Companion — write Markdown locally, preview on your theme, push/publish without `/admin`.

[Docs](https://reactpress.cc/docs/intro) · [Demo](https://demo.reactpress.cc/) · [Getting started](https://reactpress.cc/docs/getting-started) · [Headless API](https://reactpress.cc/docs/developer-guide/headless-api) · [User guide](https://reactpress.cc/docs/user-guide) · [Main repo](https://github.com/reactpressjs/reactpress)

| Surface | URL |
| --- | --- |
| Site | `http://localhost:3001` |
| Admin | `http://localhost:3001/admin/` |
| API | `http://127.0.0.1:3002/api` |

Default login: `admin` / `admin`.

## Packages

| Path | Package | Role |
| --- | --- | --- |
| [`packages/content`](./packages/content) | `@fecommunity/reactpress-content` | Auth, markdown, sync |
| [`packages/cli`](./packages/cli) | `@fecommunity/reactpress-content-cli` | `reactpress-content` CLI |
| [`packages/extension`](./packages/extension) | `reactpress-vscode` | VS Code / Cursor extension |

## Develop

```bash
cd extensions/vscode
pnpm install && pnpm build
```

### CLI

```bash
pnpm cli -- login --api http://127.0.0.1:3002/api --user admin --password admin --save-token
pnpm cli -- new "Hello ReactPress"
pnpm cli -- push ./content/posts/hello-reactpress.md
pnpm cli -- publish ./content/posts/hello-reactpress.md
```

### Extension

1. Open `extensions/vscode` as workspace root
2. `pnpm watch` (optional) → **F5** / `pnpm package:vsix`
3. **ReactPress: Connect Site** → API `http://127.0.0.1:3002/api`

## Frontmatter

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
```

First successful push writes back `id` and `updatedAt`.

## Settings

| Setting | Default |
| --- | --- |
| `reactpress.apiUrl` | `http://localhost:3002/api` |
| `reactpress.siteUrl` | `http://localhost:3001` |
| `reactpress.contentPath` | `content/posts` |
| `reactpress.username` | `""` (token in SecretStorage) |

## Quality gate

```bash
pnpm test && pnpm typecheck && pnpm build && pnpm package:vsix
```

Marketplace publish: [PRODUCTION.md](./PRODUCTION.md).
