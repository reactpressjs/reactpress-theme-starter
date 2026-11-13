# WordPress.org submission checklist

## Before upload

1. Run Theme Check in a local WordPress install with this theme active.
2. Import [Theme Unit Test](https://codex.wordpress.org/Theme_Unit_Test) content and smoke-test:
   - Home, single, page, category, tag, search, 404
   - Comments (confirm a single comment form on singles)
   - Sticky posts, featured images
   - Category/archive pages show the site footer (copyright)
   - Site Editor → Styles → Dark variation
   - Keyboard focus and skip link
3. Build the zip:

```bash
bash extensions/wordpress/scripts/pack-reactpress-blog.sh
```

4. Confirm `dist/reactpress-blog.zip` root contains `style.css`, `theme.json`, `templates/index.html`, `readme.txt`, `screenshot.png`, and `inc/`.

## Upload

1. Log in to WordPress.org.
2. Open https://wordpress.org/themes/upload/
3. Upload `dist/reactpress-blog.zip`.
4. Reply on the review ticket: https://themes.trac.wordpress.org/ticket/298039

## Notes

- Do not include `.git`, Next.js app files, or other `extensions/` packages in the zip.
- Theme slug / text domain must remain `reactpress-blog`.
- Pack script path: `extensions/wordpress/scripts/pack-reactpress-blog.sh` (outside the theme package).
