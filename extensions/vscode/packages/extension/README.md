# ReactPress for VS Code

Write Markdown in your repo, preview on your [ReactPress](https://www.reactpress.cc/) theme, and push/publish without opening `/admin`.

## Features

- **Connect Site** — log in to your ReactPress API; token stored in VS Code SecretStorage
- **New Article** — scaffold a local Markdown post with frontmatter
- **Push Draft / Publish** — sync the active Markdown file to your site
- **Pull Remote** — fetch an article by id into your workspace
- **Theme Preview** — open the visitor-site URL for a published article
- **Upload Image** — insert a ReactPress media URL into Markdown
- **CodeLens + status bar** — Push / Publish / Preview on Markdown articles

## Requirements

- A running ReactPress site (Admin API reachable; typically `…/api`)
- VS Code `1.85.0` or newer (also works in Cursor)

## Getting started

1. Open a workspace that contains (or will contain) your posts folder
2. Command Palette → **ReactPress: Connect Site**
3. Enter API URL (must include `/api`), username, and password
4. **ReactPress: New Article**, edit Markdown, then **Push Draft** or **Publish**

### Local Markdown shape

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

## Commands

| Command | Description |
| --- | --- |
| ReactPress: Connect Site | Authenticate and store API token |
| ReactPress: Disconnect | Clear stored token |
| ReactPress: New Article | Create a local Markdown post |
| ReactPress: Push Draft | Upsert as draft |
| ReactPress: Publish | Upsert and set status to publish |
| ReactPress: Push (Force) | Overwrite remote on conflict |
| ReactPress: Pull Remote | Download article by id |
| ReactPress: Open Theme Preview | Open visitor site URL |
| ReactPress: Upload Image | Upload file and insert Markdown image |

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `reactpress.apiUrl` | `http://localhost:3002/api` | API base (include `/api`) |
| `reactpress.siteUrl` | `http://localhost:3001` | Visitor site for preview |
| `reactpress.contentPath` | `content/posts` | Workspace-relative posts folder |
| `reactpress.username` | `""` | Username only; token stays in SecretStorage |

## Privacy

This extension talks only to the ReactPress API URL you configure. Credentials are used for login; the resulting token is stored in VS Code SecretStorage (not in `settings.json`). No telemetry is sent to the extension publisher.

## Support

- Docs / product: [reactpress.cc](https://www.reactpress.cc/)
- Issues: [GitHub Issues](https://github.com/reactpressjs/reactpress-theme-starter/issues)
