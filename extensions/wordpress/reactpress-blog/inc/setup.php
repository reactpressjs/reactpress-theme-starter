<?php
/**
 * Theme setup and rewrite rules.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme setup.
 *
 * @since 1.0.0
 * @return void
 */
function reactpress_blog_setup() {
	load_theme_textdomain( 'reactpress-blog', REACTPRESS_BLOG_DIR . '/languages' );

	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 48,
			'width'       => 159,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_editor_style( 'assets/css/theme.css' );
}
add_action( 'after_setup_theme', 'reactpress_blog_setup' );

/**
 * Allow bare /search and /search/ to load the search template.
 *
 * Core only rewrites search/<term>/, so get_search_link() with an empty
 * query (header search icon) 404s without this rule.
 *
 * @since 1.3.3
 * @return void
 */
function reactpress_blog_register_empty_search_rewrite() {
	add_rewrite_rule( '^search/?$', 'index.php?s=', 'top' );
}
add_action( 'init', 'reactpress_blog_register_empty_search_rewrite' );

/**
 * Flush rewrite rules once after empty-search rule is introduced.
 *
 * @since 1.3.3
 * @return void
 */
function reactpress_blog_maybe_flush_search_rewrite() {
	$state = reactpress_blog_get_state();
	if ( ! empty( $state['search_rewrite_flushed'] ) || get_option( 'reactpress_blog_search_rewrite_v1' ) ) {
		if ( empty( $state['search_rewrite_flushed'] ) ) {
			reactpress_blog_update_state( array( 'search_rewrite_flushed' => 1 ) );
			delete_option( 'reactpress_blog_search_rewrite_v1' );
		}
		return;
	}

	flush_rewrite_rules( false );
	reactpress_blog_update_state( array( 'search_rewrite_flushed' => 1 ) );
	delete_option( 'reactpress_blog_search_rewrite_v1' );
}
add_action( 'init', 'reactpress_blog_maybe_flush_search_rewrite', 99 );

/**
 * Fallback: map a missing "search" page request to an empty search query.
 *
 * Covers the window before rewrite rules are flushed, and installs where
 * pretty-permalink matching still resolves /search as a pagename.
 *
 * @since 1.3.3
 * @param array $query_vars Request query vars.
 * @return array
 */
function reactpress_blog_empty_search_request( $query_vars ) {
	if ( isset( $query_vars['s'] ) ) {
		return $query_vars;
	}

	$slug = '';
	if ( ! empty( $query_vars['pagename'] ) ) {
		$slug = (string) $query_vars['pagename'];
	} elseif ( ! empty( $query_vars['name'] ) && empty( $query_vars['post_type'] ) ) {
		$slug = (string) $query_vars['name'];
	}

	if ( 'search' !== $slug ) {
		return $query_vars;
	}

	// Respect an actual Page with slug "search" if one exists.
	if ( get_page_by_path( 'search' ) ) {
		return $query_vars;
	}

	$query_vars['s'] = '';
	unset( $query_vars['pagename'], $query_vars['page'], $query_vars['name'], $query_vars['error'] );

	return $query_vars;
}
add_filter( 'request', 'reactpress_blog_empty_search_request' );

/**
 * Pattern category.
 *
 * @since 1.0.0
 * @return void
 */
function reactpress_blog_register_pattern_categories() {
	register_block_pattern_category(
		'reactpress-blog',
		array(
			'label' => __( 'ReactPress Blog', 'reactpress-blog' ),
		)
	);
}
add_action( 'init', 'reactpress_blog_register_pattern_categories' );

/**
 * Apply Customizer posts-per-page to the main public query.
 *
 * @since 1.3.0
 * @param WP_Query $query Query.
 * @return void
 */
function reactpress_blog_pre_get_posts( $query ) {
	if ( is_admin() || ! $query instanceof WP_Query || ! $query->is_main_query() ) {
		return;
	}

	if ( ! $query->is_home() && ! $query->is_archive() && ! $query->is_search() ) {
		return;
	}

	$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', 0 ) );
	if ( $per_page > 0 ) {
		$query->set( 'posts_per_page', $per_page );
	}
}
add_action( 'pre_get_posts', 'reactpress_blog_pre_get_posts' );

/**
 * Drive the front-page Query Loop from ?rp_page when classic pagination is on.
 *
 * Static fronts use inherit:false, so core page pagination does not advance the
 * posts loop. Infinite scroll stays on page 1 and loads via AJAX instead.
 *
 * @since 1.3.12
 * @param array    $query_vars Query vars for the loop.
 * @param WP_Block $block      Query block instance.
 * @return array
 */
function reactpress_blog_query_loop_paged( $query_vars, $block ) {
	if ( (bool) get_theme_mod( 'reactpress_blog_infinite_scroll', true ) ) {
		return $query_vars;
	}

	if ( ! is_front_page() || is_home() ) {
		return $query_vars;
	}

	// Only adjust dedicated post loops (front-feed), not inherited main queries.
	$inherit = true;
	if ( isset( $block->context['query']['inherit'] ) ) {
		$inherit = (bool) $block->context['query']['inherit'];
	} elseif ( isset( $block->attrs['query']['inherit'] ) ) {
		$inherit = (bool) $block->attrs['query']['inherit'];
	}
	if ( $inherit ) {
		return $query_vars;
	}

	$rp_page = absint( isset( $_GET['rp_page'] ) ? wp_unslash( $_GET['rp_page'] ) : 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( $rp_page > 1 ) {
		$query_vars['paged'] = $rp_page;
	}

	// Keep sticky handling aligned with AJAX load-more (ignore stickies).
	$query_vars['ignore_sticky_posts'] = true;

	return $query_vars;
}
add_filter( 'query_loop_block_query_vars', 'reactpress_blog_query_loop_paged', 10, 2 );

/**
 * Body class marker.
 *
 * @since 1.1.0
 * @param string[] $classes Body classes.
 * @return string[]
 */
function reactpress_blog_body_classes( $classes ) {
	$classes[] = 'rp-theme';
	return $classes;
}
add_filter( 'body_class', 'reactpress_blog_body_classes' );
