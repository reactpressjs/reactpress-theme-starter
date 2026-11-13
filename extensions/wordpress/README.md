# WordPress extensions

WordPress ports of the ReactPress Theme Starter.

## Packages

| Package | Type | Status |
| --- | --- | --- |
| [`reactpress-blog/`](./reactpress-blog/) | Block theme (FSE) | WordPress.org review — ticket [#298039](https://themes.trac.wordpress.org/ticket/298039) |

## Package for WordPress.org

```bash
bash extensions/wordpress/scripts/pack-reactpress-blog.sh
```

Upload `dist/reactpress-blog.zip` at https://wordpress.org/themes/upload/

See [`reactpress-blog/SUBMIT.md`](./reactpress-blog/SUBMIT.md) for the review checklist.

## Adding another WordPress theme

1. Create `extensions/wordpress/<theme-slug>/` with a valid `style.css` + `theme.json` (block) or classic structure.
2. Add `extensions/wordpress/scripts/pack-<theme-slug>.sh` that zips only that folder into `dist/`.
3. Keep pack scripts and docs outside the zip contents.
