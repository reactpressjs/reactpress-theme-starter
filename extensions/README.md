# Extensions

Platform ports and companion packages that ship beyond the root Next.js visitor site.

The root Next.js app must not depend on extension runtimes. Each platform keeps its own distributable packages and packaging scripts.

## Layout

```text
extensions/
├── README.md
├── wordpress/                 # Pointer to standalone WordPress theme repo
│   └── README.md
└── vscode/                    # Pointer to standalone VS Code extension repo
    └── README.md
```

Future platforms (for example Ghost or Hugo) should be added as siblings, each with its own package folders and pack scripts — or a pointer README once the platform ships from a standalone repository.

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
| [ReactPress for WordPress](https://github.com/reactpressjs/reactpress-theme-twentytwentysix) | WordPress | Official FSE block theme — package slug `reactpress-blog` |
| [reactpress-for-vscode](https://github.com/reactpressjs/reactpress-for-vscode) | VS Code / Cursor | Official Publish Companion — Marketplace id `fecommunity.reactpress-vscode` |

## Pack (WordPress)

The WordPress theme lives in a standalone repository:

```bash
git clone https://github.com/reactpressjs/reactpress-theme-twentytwentysix.git
cd reactpress-theme-twentytwentysix
bash pack.sh
```

Output: `dist/reactpress-blog.zip`

## Develop (VS Code)

The VS Code extension lives in a standalone repository:

```bash
git clone https://github.com/reactpressjs/reactpress-for-vscode.git
cd reactpress-for-vscode
pnpm install
pnpm build
```

See [reactpress-for-vscode](https://github.com/reactpressjs/reactpress-for-vscode).
