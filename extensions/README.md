# Extensions

Platform ports and companion packages that ship the ReactPress Theme Starter design beyond the root Next.js visitor site.

The root Next.js app must not depend on extension runtimes. Each platform keeps its own distributable packages and packaging scripts.

## Layout

```text
extensions/
├── README.md
└── wordpress/                 # WordPress.org / self-hosted WP
    ├── README.md
    ├── reactpress-blog/       # Block theme (zip root = this folder)
    └── scripts/
        └── pack-reactpress-blog.sh
```

Future platforms (for example Ghost, Hugo, or other CMSs) should be added as siblings of `wordpress/`, each with its own package folders and pack scripts.

## Conventions

| Rule | Detail |
| --- | --- |
| Platform first | Group by target platform, then by package name |
| One package = one shippable unit | A WordPress theme zip must contain only that theme’s files |
| Pack scripts outside the package | Keep `.sh` / build tooling next to the package, never inside the uploaded zip |
| Stable slugs | WordPress theme directory name / text domain stay `reactpress-blog` even if the monorepo path changes |
| No cross-runtime imports | Do not import Next.js app code into platform themes |

## Packages

| Path | Platform | Description |
| --- | --- | --- |
| [`wordpress/reactpress-blog/`](./wordpress/reactpress-blog/) | WordPress | Full Site Editing (block) theme for the WordPress.org Theme Directory |

## Pack (WordPress)

```bash
bash extensions/wordpress/scripts/pack-reactpress-blog.sh
```

Output: `dist/reactpress-blog.zip`
