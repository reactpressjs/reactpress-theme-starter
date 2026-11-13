=== ReactPress Blog ===
Contributors: reactpress
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.3.8
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Tags: blog, two-columns, custom-colors, custom-logo, custom-menu, featured-images, full-site-editing, block-patterns, block-styles, sticky-post, threaded-comments, translation-ready, wide-blocks, style-variations

A clean two-column blog block theme matching the ReactPress Theme Starter layout — hero carousel, category filter, article cards, and recommended sidebar.

== Description ==

ReactPress Blog is a full site editing (block) theme for blogs and magazines, by [ReactPress](https://www.reactpress.cc/). The home layout mirrors the ReactPress Theme Starter: hero carousel, category filter pills, horizontal article cards, and a recommended readings + tags sidebar.

Theme homepage / product: https://www.reactpress.cc/

Features:

* Block theme with Site Editor support
* Home hero carousel (sticky / recent posts with covers)
* Category filter bar and ReactPress-style article cards
* Sidebar with recommended readings and colorful tags
* Header tools: search, light/dark toggle, optional GitHub link, login/register
* Infinite scroll for the post feed (optional classic pagination)
* Customizer panel for colors, sidebar width, and feed settings
* Single post, page, archive, search, and 404 templates
* Native comments styling
* Light default palette and Dark style variation
* Custom logo, navigation, and colors via theme.json

== Installation ==

1. In your WordPress admin, go to Appearance → Themes → Add New → Upload Theme.
2. Upload the `reactpress-blog.zip` file and click Install Now.
3. Activate the theme.
4. Optionally open Appearance → Editor to customize templates, styles, and navigation.
5. Choose the Dark style under Styles if desired.
6. Use Appearance → Customize → ReactPress Blog for basic colors and feed options.

== Frequently Asked Questions ==

= Does this theme require plugins? =

No. Core blogging features work with WordPress alone.

= How do I enable the dark look? =

In the Site Editor, open Styles and select the "Dark" style variation.

= Can I change the primary color? =

Yes. Use Appearance → Customize → ReactPress Blog → Colors, or Appearance → Editor → Styles → Colors.

= How does infinite scroll work? =

The home and archive feeds load the next page of posts automatically as you scroll. Turn it off under Appearance → Customize → ReactPress Blog → Layout & Feed to restore classic pagination.

== Changelog ==

= 1.3.8 =
* Remove post view counter, view labels, and views-based recommended sort (plugin territory).
* Default GitHub Customizer URL to empty so the icon only appears when a site owner sets their own link.
* Move empty-search rewrite flush to an init check; no longer update options on theme switch.
* Align Tags in readme.txt with style.css (add block-styles).
* Remove automatic Site Editor template deletion on upgrade (never wipe user customizations).
* Store theme flags in one reactpress_blog_state option; load front JS only via wp_enqueue_scripts.
* Fix 404 “Back to home” for subdirectory installs; translate 404/menu/back-to-top strings.
* Bump Tested up to: 7.1.

= 1.3.7 =
* Remove custom block registration (plugin territory); render theme UI via core/group presentation slots.
* Keep packaging scripts outside the theme package so WordPress.org Theme Check passes.

= 1.3.6 =
* Fix empty front page when Settings → Reading uses a static homepage (dedicated front-page feed that does not inherit the page query).
* Fix header nav active state so only the matching item is selected when switching Home / Blog.
* Rebuild footer About content with tagline/fallback, 24px RSS/GitHub icons, and async sidebar↔footer placement as the feed grows.

= 1.3.5 =
* Replace header search navigation with an overlay search modal.

= 1.3.4 =
* Fix reading page meta spreading (card space-between no longer leaks into single/page).
* Rebuild comment list/form styles: avatar row, muted meta links, visible fields, submit button.
* Harden Media & Text / columns / float image layout so media cannot overlay copy.
* Align page templates with the two-column reading layout; reset stale Site Editor copies.

= 1.3.3 =
* Fix bare /search and /search/ 404 when opening search from the header icon (empty query).

= 1.3.2 =
* Fix search form and search page header width inconsistency (full-width input + matching feed column).
* Fix article image/text layout: float alignment, clearfix, media-text/gallery, mobile stack.

= 1.3.1 =
* Fix header tools stuck on the left (WordPress flex layout was zeroing margin-left: auto).
* Fix navigation link size/color and dark-mode heading contrast (404 title).
* Fix search form button/input height mismatch; polish 404 and entry card styles.

= 1.3.0 =
* Fix Header Tools block crash (`wp_registration_enabled` was not a core function).
* Fix Recommended Readings / Tags header wrapping and icon alignment.
* Replace feed pagination with infinite scroll (Customizer toggle for classic pagination).
* Add ReactPress Blog Customizer panel for colors, auth buttons, sidebar width, and posts per page.
* Stabilize ServerSideRender error messages in the Site Editor.

= 1.2.0 =
* Replace shortcodes with dynamic blocks so Site Editor shows real carousel / category / sidebar UI.
* Add 3D tags cloud and sticky header behavior matching the ReactPress starter.
* Auto-clear customized templates that still contain legacy shortcodes.
* Load theme styles in the Site Editor canvas for accurate previews.

= 1.1.0 =
* Rebuild home layout to match ReactPress Theme Starter screenshot.
* Add hero carousel, category filter, recommended readings, and colorful tags.
* Fix invalid nested Query markup that broke Site Editor recovery.
* Align colors, spacing, header tools, and article cards with the starter UI.

= 1.0.0 =
* Initial release.

== Copyright ==

ReactPress Blog WordPress Theme, Copyright 2024–2026 ReactPress / FECommunity
ReactPress Blog is distributed under the terms of the GNU GPL v2 or later.

The ReactPress name, logo, and related branding used in this theme are owned by
the theme author (ReactPress / FECommunity) and are included here with that
owner's permission. This theme is an official companion to the ReactPress
project at https://www.reactpress.cc/ and https://github.com/reactpressjs/reactpress-theme-starter.

This theme ships no bundled third-party fonts or icon libraries.

Screenshot derived from the ReactPress Theme Starter demo UI (GPL-compatible / original project assets).

WordPress, Copyright WordPress.org
License: GPLv2 or later
Source: https://wordpress.org/
