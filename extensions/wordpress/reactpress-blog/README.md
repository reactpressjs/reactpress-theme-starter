# ReactPress Blog

**Version:** 1.3.8 · **Author:** [ReactPress](https://www.reactpress.cc/) · **License:** GPLv2 or later

A clean two-column blog block theme matching the ReactPress Theme Starter layout — hero carousel, category filter, article cards, and recommended sidebar.

WordPress.org–oriented Full Site Editing (block) theme port of the [ReactPress](https://www.reactpress.cc/) Theme Starter visual design.

## Theme details

| | |
| --- | --- |
| Theme name | ReactPress Blog |
| Version | 1.3.8 |
| Author | [ReactPress](https://www.reactpress.cc/) |
| Requires at least | WordPress 6.4 |
| Requires PHP | 7.4 |
| Tested up to | 7.1 |
| Text domain | `reactpress-blog` |

### Tags

`blog` · `two-columns` · `custom-colors` · `custom-logo` · `custom-menu` · `featured-images` · `full-site-editing` · `block-patterns` · `block-styles` · `sticky-post` · `threaded-comments` · `translation-ready` · `wide-blocks` · `style-variations`

### Features

- Block theme with Site Editor support
- Home hero carousel (sticky / recent posts with covers)
- Category filter bar and ReactPress-style article cards
- Sidebar with recommended readings and colorful tags
- Header tools: search, light/dark toggle, optional GitHub link, login/register
- Infinite scroll for the post feed (optional classic pagination)
- Customizer panel for colors, sidebar width, and feed settings
- Single post, page, archive, search, and 404 templates
- Native comments styling
- Light default palette and Dark style variation
- Custom logo, navigation, and colors via `theme.json`

## Requirements

- WordPress 6.4+
- PHP 7.4+

## Local install

1. Copy or symlink `extensions/reactpress-blog` into `wp-content/themes/reactpress-blog`.
2. Activate **ReactPress Blog** under Appearance → Themes.
3. Open Appearance → Editor to adjust navigation, styles, and template parts.
4. Optional: select the **Dark** style variation under Styles.
5. Optional: Appearance → Customize → **ReactPress Blog** for colors, infinite scroll, and feed settings.

## Package for WordPress.org

From the repository root:

```bash
bash extensions/pack-reactpress-blog.sh
```

This writes `dist/reactpress-blog.zip` containing only the theme folder (required structure for upload). The pack script lives outside the theme so Theme Check never sees a shell script in the package.

Upload at: https://wordpress.org/themes/upload/

## Scope

Included: posts, pages, archives, search, comments, menus, logo, light/dark styles, patterns, hero carousel, category filter, recommended readings sidebar (theme presentation slots), infinite scroll feed, Customizer basic settings.

Not included (plugin territory): knowledge base CPT, custom auth/OAuth, link directory. Login/Register links use native WordPress accounts.

## Customize

Appearance → Customize → ReactPress Blog:

| Section | Settings |
| --- | --- |
| Header & Identity | GitHub URL, show Login/Register, footer About HTML |
| Colors | Primary, button, background, surface, text, link |
| Layout & Feed | Infinite scroll toggle, posts per page, sidebar width |

## Links

- ReactPress: https://www.reactpress.cc/
- Theme repository: https://github.com/reactpressjs/reactpress-theme-starter
- WordPress.org theme upload: https://wordpress.org/themes/upload/

## License

GPLv2 or later. See `license.txt` and `readme.txt`.

ReactPress Blog WordPress Theme, Copyright 2024–2026 ReactPress / FECommunity.
