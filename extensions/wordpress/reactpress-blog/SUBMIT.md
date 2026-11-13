# WordPress.org submission checklist

## Before upload

1. Run Theme Check in a local WordPress install with this theme active.
2. Import [Theme Unit Test](https://codex.wordpress.org/Theme_Unit_Test) content and smoke-test:
   - Home, single, page, category, tag, search, 404
   - Comments, sticky posts, featured images
   - Site Editor → Styles → Dark variation
   - Keyboard focus and skip link
3. Build the zip:

```bash
bash extensions/pack-reactpress-blog.sh
```

4. Confirm `dist/reactpress-blog.zip` root contains `style.css`, `theme.json`, `templates/index.html`, `readme.txt`, `screenshot.png`.

## Upload

1. Log in to WordPress.org.
2. Open https://wordpress.org/themes/upload/
3. Upload `dist/reactpress-blog.zip`.
4. Respond to Theme Review Team tickets promptly; fix and resubmit if closed as not-approved.

## Notes

- Do not include `.git`, Next.js app files, or other `extensions/` packages in the zip.
- Theme slug / text domain must remain `reactpress-blog`.
- Actual directory publish requires a WordPress.org account with theme upload rights; this repo only prepares the package.
