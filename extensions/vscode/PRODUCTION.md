# Production readiness

Status: **Marketplace-ready package (preview)** after the v0.1 quality hardening pass. Live API E2E and Extension Host smoke still need a running ReactPress stack on your machine.

## Verified

| Check | Result |
| --- | --- |
| Unit + mock API sync tests (`pnpm test`, c8 100%) | Pass |
| Extension typecheck | Pass |
| Workspace build (`pnpm build`) | Pass |
| VSIX packaging (`pnpm package:vsix`) | Pass |
| Cover path containment (no `../` upload) | Pass |
| HTTP request timeout (30s default) | Pass |
| Conflict recovery error handling | Pass |
| Activation narrowed to Markdown / commands | Pass |
| Marketplace metadata | `publisher`, `icon`, `galleryBanner`, `categories`, `preview`, privacy notes |
| Secret token storage | VS Code `SecretStorage` (not settings.json) |
| Bundle size | highlight.js common languages only |

## Before first Marketplace publish

1. Create / verify publisher `fecommunity` on [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) (Microsoft account + Personal Access Token with Marketplace scope)
2. Optional: `vsce login fecommunity`
3. From this monorepo:

```bash
cd extensions/vscode
pnpm install
pnpm test && pnpm typecheck && pnpm build
pnpm package:vsix
pnpm --filter reactpress-vscode publish:vsce
```

4. Manual smoke after install: Connect → New → Push → Publish → Preview
5. Live E2E against a real Admin API when available

## Out of scope (by design)

- Knowledge base / CMS pages
- Admin webview editor
- Full media library UI
- Paste-image auto-upload (use **Upload Image**)
