# Extensions

Platform ports and companion packages that ship beyond the root Next.js visitor site.

The root Next.js app must not depend on extension runtimes. Each platform keeps its own distributable packages and packaging scripts.

## Layout

```text
extensions/
├── README.md
├── wordpress/                 # WordPress.org / self-hosted WP
│   ├── README.md
│   ├── reactpress-blog/       # Block theme (zip root = this folder)
│   └── scripts/
│       └── pack-reactpress-blog.sh
└── vscode/                    # VS Code / Cursor Publish Companion
    ├── README.md
    ├── packages/
    │   ├── content/           # shared publish kit
    │   ├── cli/               # reactpress-content CLI
    │   └── extension/         # VS Code extension (vsix root)
    └── package.json           # pnpm workspace for this platform
```

Future platforms (for example Ghost or Hugo) should be added as siblings, each with its own package folders and pack scripts.

## Conventions

| Rule | Detail |
| --- | --- |
| Platform first | Group by target platform, then by package name |
| One package = one shippable unit | A WordPress theme zip / VS Code vsix must contain only that package’s shippable files |
| Pack scripts outside the package | Keep `.sh` / build tooling next to the package when the store forbids tooling inside the artifact |
| Stable slugs | WordPress theme directory name / text domain stay `reactpress-blog`; VS Code extension id stays `fecommunity.reactpress-vscode` |
| No cross-runtime imports | Do not import Next.js app code into platform packages |

## Packages

| Path | Platform | Description |
| --- | --- | --- |
| [`wordpress/reactpress-blog/`](./wordpress/reactpress-blog/) | WordPress | Full Site Editing (block) theme for the WordPress.org Theme Directory |
| [`vscode/`](./vscode/) | VS Code / Cursor | Publish Companion: local Markdown → push/publish to ReactPress API |

## Pack (WordPress)

```bash
bash extensions/wordpress/scripts/pack-reactpress-blog.sh
```

Output: `dist/reactpress-blog.zip`

## Develop (VS Code)

```bash
cd extensions/vscode
pnpm install
pnpm build
```

See [`vscode/README.md`](./vscode/README.md).
