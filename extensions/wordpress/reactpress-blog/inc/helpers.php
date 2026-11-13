<?php
/**
 * Shared helpers.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tag / category accent palette (matches ReactPress starter).
 *
 * @since 1.1.0
 * @return string[]
 */
function reactpress_blog_tag_colors() {
	return array(
		'#389e0d',
		'#cf1322',
		'#096dd9',
		'#d48806',
		'#c41d7f',
		'#531dab',
		'#a8071a',
		'#006d75',
		'#237804',
		'#d4380d',
		'#434343',
		'#ad8b00',
		'#595959',
		'#08979c',
		'#3f8600',
		'#0050b3',
	);
}

/**
 * Readable text color for a solid tag background.
 *
 * @since 1.1.0
 * @param string $hex Background hex.
 * @return string
 */
function reactpress_blog_readable_text_color( $hex ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( 6 !== strlen( $hex ) ) {
		return '#ffffff';
	}

	$r   = hexdec( substr( $hex, 0, 2 ) );
	$g   = hexdec( substr( $hex, 2, 2 ) );
	$b   = hexdec( substr( $hex, 4, 2 ) );
	$yiq = ( ( $r * 299 ) + ( $g * 587 ) + ( $b * 114 ) ) / 1000;

	return $yiq >= 160 ? '#1a1a1a' : '#ffffff';
}

/**
 * Inline style for colored tags.
 *
 * @since 1.1.0
 * @param int $index Color index.
 * @return string
 */
function reactpress_blog_tag_style_attr( $index ) {
	$colors = reactpress_blog_tag_colors();
	$bg     = $colors[ absint( $index ) % count( $colors ) ];
	$fg     = reactpress_blog_readable_text_color( $bg );

	return sprintf(
		'background-color:%1$s;color:%2$s;',
		esc_attr( $bg ),
		esc_attr( $fg )
	);
}

/**
 * Human-readable relative time for carousel captions.
 *
 * @since 1.1.0
 * @param int $timestamp Unix timestamp.
 * @return string
 */
function reactpress_blog_time_ago( $timestamp ) {
	return sprintf(
		/* translators: %s: human-readable time difference */
		__( '%s ago', 'reactpress-blog' ),
		human_time_diff( $timestamp, current_time( 'timestamp' ) )
	);
}

/**
 * Posts used by the home carousel (sticky with thumbs, else recent with thumbs).
 *
 * @since 1.1.0
 * @param int $limit Max slides.
 * @return WP_Post[]
 */
function reactpress_blog_get_carousel_posts( $limit = 6 ) {
	$limit = max( 1, min( 6, absint( $limit ) ) );

	$sticky_ids = array_values( array_filter( array_map( 'absint', (array) get_option( 'sticky_posts', array() ) ) ) );
	$posts      = array();

	if ( $sticky_ids ) {
		$sticky_query = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $limit,
				'post__in'            => $sticky_ids,
				'ignore_sticky_posts' => true,
				'meta_key'            => '_thumbnail_id',
				'orderby'             => 'post__in',
				'no_found_rows'       => true,
			)
		);
		$posts = $sticky_query->posts;
	}

	if ( count( $posts ) < $limit ) {
		$exclude = wp_list_pluck( $posts, 'ID' );
		$fill    = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $limit - count( $posts ),
				'post__not_in'        => $exclude,
				'ignore_sticky_posts' => true,
				'meta_key'            => '_thumbnail_id',
				'orderby'             => 'date',
				'order'               => 'DESC',
				'no_found_rows'       => true,
			)
		);
		$posts = array_merge( $posts, $fill->posts );
	}

	if ( ! $posts ) {
		$fallback = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $limit,
				'ignore_sticky_posts' => true,
				'orderby'             => 'date',
				'order'               => 'DESC',
				'no_found_rows'       => true,
			)
		);
		$posts = $fallback->posts;
	}

	return $posts;
}

/**
 * SVG icon helpers.
 *
 * @since 1.1.0
 * @param string $name Icon key.
 * @return string
 */
function reactpress_blog_icon( $name ) {
	$icons = array(
		'search'        => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
		'close'         => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
		'sun'           => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
		'moon'          => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/></svg>',
		'github'        => '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
		'rss'           => '<svg viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M512 0C230.4 0 0 230.4 0 512s230.4 512 512 512 512-230.4 512-512S793.6 0 512 0z m-182.4 768C288 768 256 736 256 694.4s32-73.6 73.6-73.6 73.6 32 73.6 73.6-32 73.6-73.6 73.6z m185.6 0c0-144-115.2-259.2-259.2-259.2v-80c185.6 0 339.2 150.4 339.2 339.2h-80z m172.8 0c0-240-195.2-432-432-432V256c281.6 0 512 230.4 512 512h-80z"/></svg>',
		'heart'         => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
		'comment'       => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
		'bookmark'      => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
		'clock'         => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
		'folder'        => '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
		'tag'           => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
		'chevron-left'  => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
		'chevron-right' => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
	);

	return isset( $icons[ $name ] ) ? $icons[ $name ] : '';
}

/**
 * Resolve post ID for blocks that may run outside the main loop (editor SSR).
 *
 * @since 1.2.0
 * @param WP_Block|null $block Block instance.
 * @return int
 */
function reactpress_blog_block_post_id( $block = null ) {
	if ( $block instanceof WP_Block && ! empty( $block->context['postId'] ) ) {
		return absint( $block->context['postId'] );
	}

	$post_id = get_the_ID();
	return $post_id ? absint( $post_id ) : 0;
}

/**
 * URL for the posts feed home (front page, or posts page when a static front is set).
 *
 * @since 1.3.6
 * @return string
 */
function reactpress_blog_get_posts_home_url() {
	if ( 'page' === get_option( 'show_on_front' ) ) {
		// Prefer the site front — front-page.html always renders the feed.
		return home_url( '/' );
	}

	return home_url( '/' );
}

/**
 * Whether the current request is the posts feed home (front or posts index).
 *
 * @since 1.3.6
 * @return bool
 */
function reactpress_blog_is_posts_home() {
	if ( is_front_page() ) {
		return true;
	}

	if ( is_home() && ! is_front_page() ) {
		return true;
	}

	return false;
}
