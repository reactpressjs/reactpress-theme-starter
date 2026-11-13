<?php
/**
 * ReactPress Blog theme functions.
 *
 * @package ReactPress_Blog
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'REACTPRESS_BLOG_VERSION', '1.3.8' );
define( 'REACTPRESS_BLOG_STATE_OPTION', 'reactpress_blog_state' );

/**
 * Read theme state option (single prefixed array).
 *
 * @since 1.3.8
 * @return array<string, mixed>
 */
function reactpress_blog_get_state() {
	$state = get_option( REACTPRESS_BLOG_STATE_OPTION, array() );
	return is_array( $state ) ? $state : array();
}

/**
 * Merge and persist theme state.
 *
 * @since 1.3.8
 * @param array<string, mixed> $updates Keys to merge.
 * @return void
 */
function reactpress_blog_update_state( array $updates ) {
	update_option( REACTPRESS_BLOG_STATE_OPTION, array_merge( reactpress_blog_get_state(), $updates ), false );
}

/**
 * Theme setup.
 *
 * @since 1.0.0
 * @return void
 */
function reactpress_blog_setup() {
	load_theme_textdomain( 'reactpress-blog', get_template_directory() . '/languages' );

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
 * Theme styles for front end and editor canvas.
 *
 * @since 1.0.0
 * @return void
 */
function reactpress_blog_enqueue_styles() {
	wp_enqueue_style(
		'reactpress-blog-style',
		get_stylesheet_uri(),
		array(),
		REACTPRESS_BLOG_VERSION
	);

	$theme_deps = array( 'reactpress-blog-style' );
	if ( wp_style_is( 'wp-block-library', 'registered' ) ) {
		$theme_deps[] = 'wp-block-library';
	}

	wp_enqueue_style(
		'reactpress-blog-theme',
		get_template_directory_uri() . '/assets/css/theme.css',
		$theme_deps,
		REACTPRESS_BLOG_VERSION
	);

	$custom_css = reactpress_blog_get_customizer_css();
	if ( $custom_css ) {
		wp_add_inline_style( 'reactpress-blog-theme', $custom_css );
	}
}
add_action( 'enqueue_block_assets', 'reactpress_blog_enqueue_styles' );

/**
 * Front-end behavior script (carousel, theme toggle, infinite scroll).
 *
 * @since 1.3.8
 * @return void
 */
function reactpress_blog_enqueue_scripts() {
	wp_enqueue_script(
		'reactpress-blog-theme',
		get_template_directory_uri() . '/assets/js/theme.js',
		array(),
		REACTPRESS_BLOG_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', get_option( 'posts_per_page', 10 ) ) );
	if ( $per_page < 1 ) {
		$per_page = 10;
	}

	wp_localize_script(
		'reactpress-blog-theme',
		'reactpressBlog',
		array(
			'homeUrl'  => home_url( '/' ),
			'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
			'restUrl'  => esc_url_raw( rest_url( 'wp/v2/' ) ),
			'nonce'    => wp_create_nonce( 'reactpress_blog_load_more' ),
			'perPage'  => $per_page,
			'infinite' => (bool) get_theme_mod( 'reactpress_blog_infinite_scroll', true ),
			'i18n'     => array(
				'prev'       => __( 'Previous slide', 'reactpress-blog' ),
				'next'       => __( 'Next slide', 'reactpress-blog' ),
				'themeLight' => __( 'Switch to light theme', 'reactpress-blog' ),
				'themeDark'  => __( 'Switch to dark theme', 'reactpress-blog' ),
				'search'     => __( 'Search', 'reactpress-blog' ),
				'menuToggle' => __( 'Toggle menu', 'reactpress-blog' ),
				'backToTop'  => __( 'Back to top', 'reactpress-blog' ),
				'loading'    => __( 'Loading more…', 'reactpress-blog' ),
				'loadMore'   => __( 'Load more', 'reactpress-blog' ),
				'noMore'     => __( 'No more posts', 'reactpress-blog' ),
				'loadError'  => __( 'Could not load more posts.', 'reactpress-blog' ),
			),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'reactpress_blog_enqueue_scripts' );

/**
 * Prevent dark-mode flash before main script runs.
 *
 * @since 1.1.0
 * @return void
 */
function reactpress_blog_theme_boot_script() {
	?>
	<script>
	(function(){try{var t=localStorage.getItem('reactpress-blog-theme');if(t==='dark'){document.documentElement.classList.add('rp-dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();
	</script>
	<?php
}
add_action( 'wp_head', 'reactpress_blog_theme_boot_script', 0 );

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
 * Map theme presentation slots (core/group class names) to PHP renderers.
 *
 * Custom block registration is plugin territory on WordPress.org; themes may
 * still output presentational markup by filtering core blocks.
 *
 * @since 1.3.7
 * @return array<string, callable>
 */
function reactpress_blog_dynamic_slot_map() {
	return array(
		'rp-dynamic--header-tools'    => 'reactpress_blog_render_header_tools',
		'rp-dynamic--carousel'        => 'reactpress_blog_render_carousel',
		'rp-dynamic--category-menu'   => 'reactpress_blog_render_category_menu',
		'rp-dynamic--recommend'       => 'reactpress_blog_render_recommend',
		'rp-dynamic--tags'            => 'reactpress_blog_render_tags',
		'rp-dynamic--about-footer'    => static function () {
			return reactpress_blog_render_about( array( 'variant' => 'footer' ) );
		},
		'rp-dynamic--about-sidebar'   => static function () {
			return reactpress_blog_render_about( array( 'variant' => 'sidebar' ) );
		},
		'rp-dynamic--card-stats'      => 'reactpress_blog_render_card_stats',
		'rp-dynamic--infinite-scroll' => 'reactpress_blog_render_infinite_scroll',
	);
}

/**
 * Replace empty core/group slots with theme presentation markup.
 *
 * Only fills slots that have no inner blocks, so Site Editor content placed
 * inside an `rp-dynamic--*` group is preserved.
 *
 * @since 1.3.7
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_render_dynamic_slots( $block_content, $block ) {
	if ( empty( $block['attrs']['className'] ) || ! is_string( $block['attrs']['className'] ) ) {
		return $block_content;
	}

	$class_name = $block['attrs']['className'];
	if ( false === strpos( $class_name, 'rp-dynamic--' ) ) {
		return $block_content;
	}

	if ( ! empty( $block['innerBlocks'] ) ) {
		return $block_content;
	}

	foreach ( reactpress_blog_dynamic_slot_map() as $slot_class => $callback ) {
		if ( false === strpos( $class_name, $slot_class ) ) {
			continue;
		}

		if ( ! is_callable( $callback ) ) {
			return $block_content;
		}

		return (string) call_user_func( $callback );
	}

	return $block_content;
}
add_filter( 'render_block_core/group', 'reactpress_blog_render_dynamic_slots', 10, 2 );

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
 * Sanitize checkbox to boolean theme_mod.
 *
 * @since 1.3.0
 * @param mixed $value Raw value.
 * @return bool
 */
function reactpress_blog_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Sanitize posts-per-page setting.
 *
 * @since 1.3.0
 * @param mixed $value Raw value.
 * @return int
 */
function reactpress_blog_sanitize_posts_per_page( $value ) {
	$value = absint( $value );
	if ( $value < 1 ) {
		$value = 10;
	}
	return min( 50, $value );
}

/**
 * Customizer: basic theme configuration.
 *
 * @since 1.1.0
 * @param WP_Customize_Manager $wp_customize Customizer.
 * @return void
 */
function reactpress_blog_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'reactpress_blog_panel',
		array(
			'title'    => __( 'ReactPress Blog', 'reactpress-blog' ),
			'priority' => 160,
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_identity',
		array(
			'title' => __( 'Header & Identity', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_colors',
		array(
			'title' => __( 'Colors', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_layout',
		array(
			'title' => __( 'Layout & Feed', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_github_url',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_github_url',
		array(
			'label'       => __( 'GitHub URL', 'reactpress-blog' ),
			'description' => __( 'Shown as an icon in the site header. Leave empty to hide.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_identity',
			'type'        => 'url',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_show_auth',
		array(
			'default'           => true,
			'sanitize_callback' => 'reactpress_blog_sanitize_checkbox',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_show_auth',
		array(
			'label'   => __( 'Show Login / Register buttons', 'reactpress-blog' ),
			'section' => 'reactpress_blog_identity',
			'type'    => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_footer_info',
		array(
			'default'           => '',
			'sanitize_callback' => 'wp_kses_post',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_footer_info',
		array(
			'label'       => __( 'Footer / About HTML', 'reactpress-blog' ),
			'description' => __( 'Shown under About in the footer and sidebar. Leave empty to use the site tagline / fallback.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_identity',
			'type'        => 'textarea',
		)
	);

	$color_settings = array(
		'reactpress_blog_primary_color'        => array(
			'label'   => __( 'Primary color', 'reactpress-blog' ),
			'default' => '#f44336',
		),
		'reactpress_blog_primary_button_color' => array(
			'label'   => __( 'Primary button color', 'reactpress-blog' ),
			'default' => '#c62828',
		),
		'reactpress_blog_background_color'     => array(
			'label'   => __( 'Background color', 'reactpress-blog' ),
			'default' => '#e7eaee',
		),
		'reactpress_blog_surface_color'        => array(
			'label'   => __( 'Surface (card) color', 'reactpress-blog' ),
			'default' => '#ffffff',
		),
		'reactpress_blog_text_color'           => array(
			'label'   => __( 'Text color', 'reactpress-blog' ),
			'default' => '#1a1a1a',
		),
		'reactpress_blog_link_color'           => array(
			'label'   => __( 'Link color', 'reactpress-blog' ),
			'default' => '#4299e1',
		),
	);

	foreach ( $color_settings as $id => $args ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $args['default'],
				'sanitize_callback' => 'sanitize_hex_color',
				'transport'         => 'refresh',
			)
		);

		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				$id,
				array(
					'label'   => $args['label'],
					'section' => 'reactpress_blog_colors',
				)
			)
		);
	}

	$wp_customize->add_setting(
		'reactpress_blog_infinite_scroll',
		array(
			'default'           => true,
			'sanitize_callback' => 'reactpress_blog_sanitize_checkbox',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_infinite_scroll',
		array(
			'label'       => __( 'Infinite scroll (load more on scroll)', 'reactpress-blog' ),
			'description' => __( 'When disabled, classic pagination is shown.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_posts_per_page',
		array(
			'default'           => absint( get_option( 'posts_per_page', 10 ) ),
			'sanitize_callback' => 'reactpress_blog_sanitize_posts_per_page',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_posts_per_page',
		array(
			'label'       => __( 'Posts loaded per page', 'reactpress-blog' ),
			'description' => __( 'Used by the home/archive feed and infinite scroll.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'number',
			'input_attrs' => array(
				'min'  => 1,
				'max'  => 50,
				'step' => 1,
			),
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_sidebar_width',
		array(
			'default'           => 18,
			'sanitize_callback' => static function ( $value ) {
				$value = absint( $value );
				return min( 28, max( 14, $value ? $value : 18 ) );
			},
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_sidebar_width',
		array(
			'label'       => __( 'Sidebar width (rem)', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'number',
			'input_attrs' => array(
				'min'  => 14,
				'max'  => 28,
				'step' => 1,
			),
		)
	);
}
add_action( 'customize_register', 'reactpress_blog_customize_register' );

/**
 * Build CSS overrides from Customizer settings.
 *
 * @since 1.3.0
 * @return string
 */
function reactpress_blog_get_customizer_css() {
	$map = array(
		'reactpress_blog_primary_color'        => array( '--rp-primary', '--wp--preset--color--primary' ),
		'reactpress_blog_primary_button_color' => array( '--rp-primary-button', '--wp--preset--color--primary-button' ),
		'reactpress_blog_background_color'     => array( '--rp-bg-body', '--wp--preset--color--background' ),
		'reactpress_blog_surface_color'        => array( '--rp-bg-box', '--wp--preset--color--surface' ),
		'reactpress_blog_text_color'           => array( '--rp-text', '--wp--preset--color--foreground' ),
		'reactpress_blog_link_color'           => array( '--rp-link', '--wp--preset--color--link' ),
	);

	$vars = array();
	foreach ( $map as $mod => $css_vars ) {
		$color = get_theme_mod( $mod, '' );
		if ( ! is_string( $color ) || ! sanitize_hex_color( $color ) ) {
			continue;
		}
		foreach ( $css_vars as $css_var ) {
			$vars[] = $css_var . ':' . $color;
		}
	}

	$sidebar = absint( get_theme_mod( 'reactpress_blog_sidebar_width', 18 ) );
	if ( $sidebar >= 14 && $sidebar <= 28 ) {
		$vars[] = '--rp-sidebar-width:' . $sidebar . 'rem';
	}

	if ( ! $vars ) {
		return '';
	}

	return ':root,body{' . implode( ';', $vars ) . ';}';
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
 * Block: header utility icons + auth buttons.
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_header_tools() {
	$github    = trim( (string) get_theme_mod( 'reactpress_blog_github_url', '' ) );
	$show_auth = (bool) get_theme_mod( 'reactpress_blog_show_auth', true );
	$login     = wp_login_url( home_url( '/' ) );
	$reg       = get_option( 'users_can_register' ) ? wp_registration_url() : '';

	ob_start();
	?>
	<div class="rp-header-tools">
		<ul class="rp-header-tools__icons" role="list">
			<li>
				<button type="button" class="rp-icon-btn" data-rp-search-open aria-haspopup="dialog" aria-controls="rp-search-modal" aria-label="<?php esc_attr_e( 'Search', 'reactpress-blog' ); ?>">
					<?php echo reactpress_blog_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</button>
			</li>
			<li>
				<button type="button" class="rp-icon-btn rp-theme-toggle" aria-label="<?php esc_attr_e( 'Switch theme', 'reactpress-blog' ); ?>" data-rp-theme-toggle>
					<span class="rp-theme-toggle__sun"><?php echo reactpress_blog_icon( 'sun' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
					<span class="rp-theme-toggle__moon"><?php echo reactpress_blog_icon( 'moon' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
				</button>
			</li>
			<?php if ( $github ) : ?>
				<li>
					<a class="rp-icon-btn" href="<?php echo esc_url( $github ); ?>" target="_blank" rel="noopener noreferrer nofollow" aria-label="<?php esc_attr_e( 'GitHub', 'reactpress-blog' ); ?>">
						<?php echo reactpress_blog_icon( 'github' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</a>
				</li>
			<?php endif; ?>
		</ul>
		<?php if ( $show_auth ) : ?>
			<div class="rp-header-auth">
				<?php if ( is_user_logged_in() ) : ?>
					<a class="rp-btn rp-btn--ghost" href="<?php echo esc_url( admin_url() ); ?>"><?php esc_html_e( 'Dashboard', 'reactpress-blog' ); ?></a>
				<?php else : ?>
					<a class="rp-btn rp-btn--ghost" href="<?php echo esc_url( $login ); ?>"><?php esc_html_e( 'Login', 'reactpress-blog' ); ?></a>
					<?php if ( $reg ) : ?>
						<a class="rp-btn rp-btn--primary" href="<?php echo esc_url( $reg ); ?>"><?php esc_html_e( 'Register', 'reactpress-blog' ); ?></a>
					<?php endif; ?>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
	<?php
	return (string) ob_get_clean();
}

/**
 * Search overlay: open from header icon, submit to search results.
 *
 * @since 1.3.5
 * @return void
 */
function reactpress_blog_render_search_modal() {
	$placeholder = __( 'Search articles…', 'reactpress-blog' );
	?>
	<div
		id="rp-search-modal"
		class="rp-search-modal"
		hidden
		data-rp-search-modal
		role="dialog"
		aria-modal="true"
		aria-labelledby="rp-search-modal-title"
	>
		<div class="rp-search-modal__backdrop" data-rp-search-close tabindex="-1"></div>
		<div class="rp-search-modal__panel">
			<div class="rp-search-modal__top">
				<h2 id="rp-search-modal-title" class="rp-search-modal__title"><?php esc_html_e( 'Search', 'reactpress-blog' ); ?></h2>
				<button type="button" class="rp-icon-btn rp-search-modal__close" data-rp-search-close aria-label="<?php esc_attr_e( 'Close search', 'reactpress-blog' ); ?>">
					<?php echo reactpress_blog_icon( 'close' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</button>
			</div>
			<form class="rp-search-modal__form" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
				<label class="screen-reader-text" for="rp-search-modal-input"><?php esc_html_e( 'Search for:', 'reactpress-blog' ); ?></label>
				<div class="rp-search-modal__field">
					<input
						id="rp-search-modal-input"
						class="rp-search-modal__input"
						type="search"
						name="s"
						value="<?php echo esc_attr( get_search_query() ); ?>"
						placeholder="<?php echo esc_attr( $placeholder ); ?>"
						autocomplete="off"
						enterkeyhint="search"
						data-rp-search-input
					/>
					<button type="submit" class="rp-search-modal__submit" aria-label="<?php esc_attr_e( 'Submit search', 'reactpress-blog' ); ?>">
						<?php echo reactpress_blog_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</button>
				</div>
			</form>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', 'reactpress_blog_render_search_modal' );

/**
 * Block: featured carousel.
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_carousel() {
	$posts = reactpress_blog_get_carousel_posts( 6 );
	if ( ! $posts ) {
		return '<div class="rp-carousel rp-carousel--empty" role="status">' . esc_html__( 'No posts yet.', 'reactpress-blog' ) . '</div>';
	}

	$logo  = get_template_directory_uri() . '/assets/images/logo.svg';
	$count = count( $posts );

	ob_start();
	?>
	<section class="rp-carousel" aria-roledescription="carousel" aria-label="<?php esc_attr_e( 'Recommended readings', 'reactpress-blog' ); ?>" data-rp-carousel style="--rp-autoplay-ms:5000ms">
		<div class="rp-carousel__viewport">
			<?php foreach ( $posts as $index => $post ) : ?>
				<?php
				$is_active = 0 === $index;
				$thumb     = get_the_post_thumbnail_url( $post, 'large' );
				$time_ago  = reactpress_blog_time_ago( get_post_time( 'U', true, $post ) );
				?>
				<article class="rp-carousel__slide<?php echo $is_active ? ' is-active' : ''; ?>" data-slide="<?php echo esc_attr( (string) $index ); ?>" aria-hidden="<?php echo $is_active ? 'false' : 'true'; ?>">
					<?php if ( $thumb ) : ?>
						<img class="rp-carousel__image" src="<?php echo esc_url( $thumb ); ?>" alt="" loading="<?php echo $is_active ? 'eager' : 'lazy'; ?>" decoding="async" />
					<?php else : ?>
						<div class="rp-carousel__fallback">
							<img src="<?php echo esc_url( $logo ); ?>" alt="" width="180" height="164" loading="lazy" />
						</div>
					<?php endif; ?>
					<div class="rp-carousel__overlay" aria-hidden="true"></div>
					<a class="rp-carousel__link" href="<?php echo esc_url( get_permalink( $post ) ); ?>" tabindex="<?php echo $is_active ? '0' : '-1'; ?>">
						<div class="rp-carousel__caption">
							<h2 class="rp-carousel__title"><?php echo esc_html( get_the_title( $post ) ); ?></h2>
							<p class="rp-carousel__meta">
								<span><?php echo esc_html( $time_ago ); ?></span>
							</p>
						</div>
					</a>
				</article>
			<?php endforeach; ?>
		</div>

		<?php if ( $count > 1 ) : ?>
			<button type="button" class="rp-carousel__nav rp-carousel__nav--prev" data-rp-carousel-prev aria-label="<?php esc_attr_e( 'Previous slide', 'reactpress-blog' ); ?>">
				<?php echo reactpress_blog_icon( 'chevron-left' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
			<button type="button" class="rp-carousel__nav rp-carousel__nav--next" data-rp-carousel-next aria-label="<?php esc_attr_e( 'Next slide', 'reactpress-blog' ); ?>">
				<?php echo reactpress_blog_icon( 'chevron-right' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
			<div class="rp-carousel__dots" role="tablist" aria-label="<?php esc_attr_e( 'Recommended readings', 'reactpress-blog' ); ?>">
				<?php for ( $i = 0; $i < $count; $i++ ) : ?>
					<button type="button" role="tab" class="rp-carousel__dot<?php echo 0 === $i ? ' is-active' : ''; ?>" data-rp-carousel-dot="<?php echo esc_attr( (string) $i ); ?>" aria-selected="<?php echo 0 === $i ? 'true' : 'false'; ?>" aria-label="<?php echo esc_attr( sprintf( /* translators: 1: current slide, 2: total */ __( 'Slide %1$d of %2$d', 'reactpress-blog' ), $i + 1, $count ) ); ?>">
						<span class="rp-carousel-dot<?php echo 0 === $i ? ' is-active' : ''; ?>"></span>
					</button>
				<?php endfor; ?>
			</div>
			<div class="rp-carousel-progress-track" aria-hidden="true">
				<div class="rp-carousel-progress-meteor" data-rp-carousel-progress></div>
			</div>
		<?php endif; ?>
	</section>
	<?php
	return (string) ob_get_clean();
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

/**
 * Block: category filter pills.
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_category_menu() {
	$categories = get_categories(
		array(
			'hide_empty' => true,
			'number'     => 12,
			'orderby'    => 'count',
			'order'      => 'DESC',
		)
	);

	$current = '';
	if ( is_category() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$current = $term->slug;
		}
	}

	$is_home = reactpress_blog_is_posts_home() || ( defined( 'REST_REQUEST' ) && REST_REQUEST && ! $current );

	ob_start();
	?>
	<nav class="rp-category-menu" aria-label="<?php esc_attr_e( 'Categories', 'reactpress-blog' ); ?>">
		<ul class="rp-category-menu__list" role="list">
			<li>
				<a class="rp-category-menu__link<?php echo ( $is_home && ! $current ) ? ' is-active' : ''; ?>" href="<?php echo esc_url( reactpress_blog_get_posts_home_url() ); ?>">
					<?php esc_html_e( 'All', 'reactpress-blog' ); ?>
				</a>
			</li>
			<?php foreach ( $categories as $category ) : ?>
				<li>
					<a class="rp-category-menu__link<?php echo ( $current === $category->slug ) ? ' is-active' : ''; ?>" href="<?php echo esc_url( get_category_link( $category ) ); ?>">
						<?php echo esc_html( $category->name ); ?>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>
	</nav>
	<?php
	return (string) ob_get_clean();
}

/**
 * Block: About (footer / sidebar), matching ReactPress SiteFooter + AboutUs.
 *
 * @since 1.3.6
 * @param array $attributes Block attributes.
 * @return string
 */
function reactpress_blog_render_about( $attributes = array() ) {
	$variant = isset( $attributes['variant'] ) ? sanitize_key( $attributes['variant'] ) : 'footer';
	if ( ! in_array( $variant, array( 'footer', 'sidebar' ), true ) ) {
		$variant = 'footer';
	}

	$site_title = get_bloginfo( 'name' );
	$tagline    = trim( (string) get_bloginfo( 'description' ) );
	$footer_html = trim( (string) get_theme_mod( 'reactpress_blog_footer_info', '' ) );
	$github      = trim( (string) get_theme_mod( 'reactpress_blog_github_url', '' ) );
	$rss_url     = get_bloginfo( 'rss2_url' );
	$year        = gmdate( 'Y' );

	$fallback = sprintf(
		/* translators: %s: site title */
		__( '%s — Powered by WordPress', 'reactpress-blog' ),
		$site_title ? $site_title : __( 'This site', 'reactpress-blog' )
	);

	ob_start();

	if ( 'sidebar' === $variant ) {
		?>
		<section class="rp-widget-panel rp-sidebar-widget rp-about-widget rp-sidebar-widget--compact" data-rp-about="sidebar" hidden>
			<div class="rp-sidebar-widget__header">
				<span class="rp-sidebar-widget__title"><?php esc_html_e( 'About', 'reactpress-blog' ); ?></span>
			</div>
			<div class="rp-sidebar-widget__body rp-about__body">
				<?php if ( $tagline ) : ?>
					<p class="rp-about__tagline"><?php echo esc_html( $tagline ); ?></p>
				<?php endif; ?>
				<?php if ( $footer_html ) : ?>
					<div class="rp-about__html rp-rich-text"><?php echo wp_kses_post( $footer_html ); ?></div>
				<?php elseif ( ! $tagline ) : ?>
					<p class="rp-about__tagline"><?php echo esc_html( $fallback ); ?></p>
				<?php endif; ?>
				<?php echo reactpress_blog_render_about_icons( $rss_url, $github ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>
		</section>
		<?php
		return (string) ob_get_clean();
	}

	?>
	<div class="rp-footer__about" data-rp-about="footer">
		<div class="rp-footer__about-main">
			<div class="rp-footer__about-copy">
				<div class="rp-footer__about-title"><?php esc_html_e( 'About', 'reactpress-blog' ); ?></div>
				<?php if ( $tagline ) : ?>
					<p class="rp-about__tagline"><?php echo esc_html( $tagline ); ?></p>
				<?php endif; ?>
				<?php if ( $footer_html ) : ?>
					<div class="rp-about__html rp-rich-text"><?php echo wp_kses_post( $footer_html ); ?></div>
				<?php elseif ( ! $tagline ) : ?>
					<p class="rp-about__tagline"><?php echo esc_html( $fallback ); ?></p>
				<?php endif; ?>
			</div>
			<?php echo reactpress_blog_render_about_icons( $rss_url, $github ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</div>
		<div class="rp-footer__copy">
			<a class="rp-footer__site" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( $site_title ); ?></a>
			<span aria-hidden="true"> · </span>
			<span>© <?php echo esc_html( $year ); ?></span>
		</div>
	</div>
	<?php
	return (string) ob_get_clean();
}

/**
 * RSS / GitHub icon row for About / footer.
 *
 * @since 1.3.6
 * @param string $rss_url RSS feed URL.
 * @param string $github  GitHub profile URL.
 * @return string
 */
function reactpress_blog_render_about_icons( $rss_url, $github ) {
	ob_start();
	?>
	<ul class="rp-footer-icons" role="list">
		<?php if ( $rss_url ) : ?>
			<li>
				<a class="rp-footer-icon" href="<?php echo esc_url( $rss_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'RSS Feed', 'reactpress-blog' ); ?>">
					<?php echo reactpress_blog_icon( 'rss' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</a>
			</li>
		<?php endif; ?>
		<?php if ( $github ) : ?>
			<li>
				<a class="rp-footer-icon" href="<?php echo esc_url( $github ); ?>" target="_blank" rel="noopener noreferrer nofollow" aria-label="<?php esc_attr_e( 'GitHub', 'reactpress-blog' ); ?>">
					<?php echo reactpress_blog_icon( 'github' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</a>
			</li>
		<?php endif; ?>
	</ul>
	<?php
	return (string) ob_get_clean();
}

/**
 * Block: recommended readings widget.
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_recommend() {
	$query = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => 6,
			'ignore_sticky_posts' => true,
			'orderby'             => 'comment_count',
			'order'               => 'DESC',
			'no_found_rows'       => true,
		)
	);

	ob_start();
	?>
	<section class="rp-widget-panel rp-sidebar-widget rp-recommend-widget">
		<div class="rp-sidebar-widget__header">
			<span class="rp-sidebar-widget__icon" aria-hidden="true"><?php echo reactpress_blog_icon( 'heart' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			<span class="rp-sidebar-widget__title"><?php esc_html_e( 'Recommended Readings', 'reactpress-blog' ); ?></span>
		</div>
		<div class="rp-sidebar-widget__body">
			<?php if ( $query->have_posts() ) : ?>
				<ul class="rp-recommend-list" role="list">
					<?php
					$rank = 0;
					while ( $query->have_posts() ) :
						$query->the_post();
						$rank++;
						?>
						<li class="rp-recommend-item">
							<a class="rp-recommend-link" href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>">
								<span class="rp-recommend-rank" data-rank="<?php echo esc_attr( (string) $rank ); ?>" aria-hidden="true"><?php echo esc_html( (string) $rank ); ?></span>
								<span class="rp-recommend-title"><?php the_title(); ?></span>
							</a>
						</li>
					<?php endwhile; ?>
				</ul>
				<?php wp_reset_postdata(); ?>
			<?php else : ?>
				<p class="rp-widget-empty"><?php esc_html_e( 'No posts yet.', 'reactpress-blog' ); ?></p>
			<?php endif; ?>
		</div>
	</section>
	<?php
	return (string) ob_get_clean();
}

/**
 * Block: colorful tags widget (3D cloud when enough tags).
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_tags() {
	$tags = get_tags(
		array(
			'hide_empty' => true,
			'number'     => 24,
			'orderby'    => 'count',
			'order'      => 'DESC',
		)
	);

	$use_cloud = ! empty( $tags ) && ! is_wp_error( $tags ) && count( $tags ) > 4;
	$classes   = 'rp-widget-panel rp-sidebar-widget rp-tags-widget';
	$classes  .= $use_cloud ? ' rp-sidebar-widget--cloud' : ' rp-sidebar-widget--compact';

	ob_start();
	?>
	<section class="<?php echo esc_attr( $classes ); ?>">
		<div class="rp-sidebar-widget__header">
			<span class="rp-sidebar-widget__icon" aria-hidden="true"><?php echo reactpress_blog_icon( 'tag' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			<span class="rp-sidebar-widget__title"><?php esc_html_e( 'Tags', 'reactpress-blog' ); ?></span>
		</div>
		<div class="rp-sidebar-widget__body">
			<?php if ( ! empty( $tags ) && ! is_wp_error( $tags ) ) : ?>
				<?php if ( $use_cloud ) : ?>
					<div class="rp-sidebar-widget__tag-host">
						<div class="rp-tag-cloud" data-rp-tag-cloud aria-hidden="true">
							<?php foreach ( array_values( $tags ) as $index => $tag ) : ?>
								<a href="<?php echo esc_url( get_tag_link( $tag ) ); ?>" tabindex="-1" style="<?php echo esc_attr( reactpress_blog_tag_style_attr( $index ) ); ?>">
									<?php echo esc_html( $tag->name ); ?>
								</a>
							<?php endforeach; ?>
						</div>
					</div>
					<nav class="screen-reader-text" aria-label="<?php esc_attr_e( 'Tags', 'reactpress-blog' ); ?>">
						<ul>
							<?php foreach ( $tags as $tag ) : ?>
								<li><a href="<?php echo esc_url( get_tag_link( $tag ) ); ?>"><?php echo esc_html( $tag->name ); ?></a></li>
							<?php endforeach; ?>
						</ul>
					</nav>
				<?php else : ?>
					<ul class="rp-sidebar-widget__tags-list" role="list">
						<?php foreach ( array_values( $tags ) as $index => $tag ) : ?>
							<li>
								<a class="rp-tag-pill" href="<?php echo esc_url( get_tag_link( $tag ) ); ?>" style="<?php echo esc_attr( reactpress_blog_tag_style_attr( $index ) ); ?>">
									<?php echo esc_html( $tag->name ); ?>
								</a>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			<?php else : ?>
				<p class="rp-widget-empty"><?php esc_html_e( 'No tags yet.', 'reactpress-blog' ); ?></p>
			<?php endif; ?>
		</div>
	</section>
	<?php
	return (string) ob_get_clean();
}

/**
 * Card meta stats (comment count) for post templates.
 *
 * @since 1.2.0
 * @return string
 */
function reactpress_blog_render_card_stats() {
	$post_id = reactpress_blog_block_post_id();
	if ( ! $post_id ) {
		return '';
	}

	$comments = (int) get_comments_number( $post_id );

	return sprintf(
		'<span class="rp-card-stats"><span class="rp-card-stats__item">%1$s<span>%2$s</span></span></span>',
		reactpress_blog_icon( 'heart' ),
		esc_html( (string) $comments )
	);
}

/**
 * Infinite scroll sentinel (replaces classic pagination when enabled).
 *
 * @since 1.3.0
 * @return string
 */
function reactpress_blog_render_infinite_scroll() {
	$enabled = (bool) get_theme_mod( 'reactpress_blog_infinite_scroll', true );

	global $wp_query;
	$max_pages = isset( $wp_query->max_num_pages ) ? absint( $wp_query->max_num_pages ) : 1;
	$current   = max( 1, absint( get_query_var( 'paged' ) ), absint( get_query_var( 'page' ) ) );

	/*
	 * Static front pages use a dedicated posts Query Loop (inherit:false), so the
	 * main query is the page. Mirror the AJAX loader args to compute max pages.
	 */
	if ( ( is_front_page() && ! is_home() ) || ( is_front_page() && is_page() ) ) {
		$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', get_option( 'posts_per_page', 10 ) ) );
		if ( $per_page < 1 ) {
			$per_page = 10;
		}
		$derived   = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $per_page,
				'paged'               => 1,
				'ignore_sticky_posts' => true,
				'no_found_rows'       => false,
			)
		);
		$max_pages = max( 1, absint( $derived->max_num_pages ) );
		$current   = 1;
		wp_reset_postdata();
	}

	$has_more = $current < $max_pages;

	$context = array(
		'category' => '',
		'tag'      => '',
		'search'   => '',
		'author'   => 0,
		'year'     => '',
		'month'    => '',
	);

	if ( is_category() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$context['category'] = $term->slug;
		}
	} elseif ( is_tag() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$context['tag'] = $term->slug;
		}
	} elseif ( is_search() ) {
		$context['search'] = get_search_query();
	} elseif ( is_author() ) {
		$context['author'] = absint( get_queried_object_id() );
	} elseif ( is_date() ) {
		$context['year']  = get_query_var( 'year' ) ? (string) absint( get_query_var( 'year' ) ) : '';
		$context['month'] = get_query_var( 'monthnum' ) ? (string) absint( get_query_var( 'monthnum' ) ) : '';
	}

	if ( ! $enabled ) {
		ob_start();
		?>
		<div class="rp-feed-pagination">
			<?php
			the_posts_pagination(
				array(
					'mid_size'  => 2,
					'prev_text' => __( 'Previous Page', 'reactpress-blog' ),
					'next_text' => __( 'Next Page', 'reactpress-blog' ),
					'class'     => 'rp-pagination',
				)
			);
			?>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', get_option( 'posts_per_page', 10 ) ) );
	if ( $per_page < 1 ) {
		$per_page = 10;
	}

	ob_start();
	?>
	<div
		class="rp-infinite-scroll"
		data-rp-infinite-scroll
		data-page="<?php echo esc_attr( (string) $current ); ?>"
		data-max="<?php echo esc_attr( (string) max( 1, $max_pages ) ); ?>"
		data-has-more="<?php echo $has_more ? '1' : '0'; ?>"
		data-page-size="<?php echo esc_attr( (string) $per_page ); ?>"
		data-category="<?php echo esc_attr( $context['category'] ); ?>"
		data-tag="<?php echo esc_attr( $context['tag'] ); ?>"
		data-search="<?php echo esc_attr( $context['search'] ); ?>"
		data-author="<?php echo esc_attr( (string) $context['author'] ); ?>"
		data-year="<?php echo esc_attr( $context['year'] ); ?>"
		data-month="<?php echo esc_attr( $context['month'] ); ?>"
	>
		<div class="rp-infinite-scroll__status" data-rp-infinite-status hidden>
			<span class="rp-load-indicator" aria-hidden="true"><span></span><span></span><span></span></span>
			<span class="rp-infinite-scroll__label"><?php esc_html_e( 'Loading more…', 'reactpress-blog' ); ?></span>
		</div>
		<div class="rp-infinite-scroll__sentinel" data-rp-infinite-sentinel tabindex="-1" aria-hidden="true"></div>
		<p class="rp-infinite-scroll__end" data-rp-infinite-end hidden>
			<?php esc_html_e( 'No more posts', 'reactpress-blog' ); ?>
		</p>
	</div>
	<?php
	return (string) ob_get_clean();
}

/**
 * Render a single post card (AJAX + shared markup).
 *
 * @since 1.3.0
 * @param WP_Post|int $post Post object or ID.
 * @return string
 */
function reactpress_blog_render_post_card( $post ) {
	$post = get_post( $post );
	if ( ! $post instanceof WP_Post ) {
		return '';
	}

	$post_id   = (int) $post->ID;
	$permalink = get_permalink( $post );
	$title     = get_the_title( $post );
	$excerpt   = get_the_excerpt( $post );
	$date      = get_the_date( 'Y-m-d', $post );
	$thumb     = get_the_post_thumbnail_url( $post, 'medium' );
	$logo      = get_template_directory_uri() . '/assets/images/logo.svg';
	$comments  = (int) get_comments_number( $post_id );

	$categories = get_the_category( $post_id );
	$cat_html   = '';
	if ( $categories ) {
		$cat   = $categories[0];
		$index = 0;
		$all   = get_categories(
			array(
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);
		foreach ( array_values( $all ) as $i => $item ) {
			if ( (int) $item->term_id === (int) $cat->term_id ) {
				$index = $i;
				break;
			}
		}
		$cat_html = sprintf(
			'<a class="rp-category-tag" href="%1$s" style="%2$s">%3$s<span>%4$s</span></a>',
			esc_url( get_category_link( $cat ) ),
			esc_attr( reactpress_blog_tag_style_attr( $index ) ),
			reactpress_blog_icon( 'folder' ),
			esc_html( $cat->name )
		);
	}

	$cover = $thumb
		? sprintf(
			'<figure class="wp-block-post-featured-image rp-post-card__cover"><a href="%1$s"><img src="%2$s" alt="" width="200" height="114" loading="lazy" decoding="async" /></a></figure>',
			esc_url( $permalink ),
			esc_url( $thumb )
		)
		: sprintf(
			'<figure class="wp-block-post-featured-image rp-post-card__cover rp-post-card__cover--fallback"><a href="%1$s"><img src="%2$s" alt="" width="200" height="114" loading="lazy" decoding="async" /></a></figure>',
			esc_url( $permalink ),
			esc_url( $logo )
		);

	$stats = sprintf(
		'<span class="rp-card-stats"><span class="rp-card-stats__item">%1$s<span>%2$s</span></span></span>',
		reactpress_blog_icon( 'heart' ),
		esc_html( (string) $comments )
	);

	return sprintf(
		'<article class="wp-block-group rp-post-card">%1$s<div class="wp-block-group rp-post-card__body"><div class="wp-block-group rp-post-card__header"><h2 class="wp-block-post-title has-medium-font-size"><a href="%2$s">%3$s</a></h2>%4$s</div><div class="wp-block-post-excerpt has-small-font-size"><p>%5$s</p></div><div class="wp-block-group rp-post-meta">%6$s<div class="wp-block-group rp-post-meta__right"><time class="wp-block-post-date has-small-font-size" datetime="%7$s">%8$s</time></div></div></div></article>',
		$cover,
		esc_url( $permalink ),
		esc_html( $title ),
		$cat_html,
		esc_html( wp_strip_all_tags( $excerpt ) ),
		$stats,
		esc_attr( get_the_date( DATE_W3C, $post ) ),
		esc_html( $date )
	);
}

/**
 * AJAX: load more posts for infinite scroll.
 *
 * @since 1.3.0
 * @return void
 */
function reactpress_blog_ajax_load_more() {
	check_ajax_referer( 'reactpress_blog_load_more', 'nonce' );

	$page     = max( 1, absint( isset( $_REQUEST['page'] ) ? wp_unslash( $_REQUEST['page'] ) : 1 ) );
	$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', get_option( 'posts_per_page', 10 ) ) );
	if ( $per_page < 1 ) {
		$per_page = 10;
	}

	$args = array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => $per_page,
		'paged'               => $page,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => false,
	);

	$category = isset( $_REQUEST['category'] ) ? sanitize_title( wp_unslash( $_REQUEST['category'] ) ) : '';
	$tag      = isset( $_REQUEST['tag'] ) ? sanitize_title( wp_unslash( $_REQUEST['tag'] ) ) : '';
	$search   = isset( $_REQUEST['search'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['search'] ) ) : '';
	$author   = isset( $_REQUEST['author'] ) ? absint( wp_unslash( $_REQUEST['author'] ) ) : 0;
	$year     = isset( $_REQUEST['year'] ) ? absint( wp_unslash( $_REQUEST['year'] ) ) : 0;
	$month    = isset( $_REQUEST['month'] ) ? absint( wp_unslash( $_REQUEST['month'] ) ) : 0;

	if ( $category ) {
		$args['category_name'] = $category;
	}
	if ( $tag ) {
		$args['tag'] = $tag;
	}
	if ( $search ) {
		$args['s'] = $search;
	}
	if ( $author ) {
		$args['author'] = $author;
	}
	if ( $year ) {
		$args['year'] = $year;
	}
	if ( $month ) {
		$args['monthnum'] = $month;
	}

	$query = new WP_Query( $args );
	$html  = '';

	if ( $query->have_posts() ) {
		foreach ( $query->posts as $post ) {
			$html .= reactpress_blog_render_post_card( $post );
		}
	}

	wp_send_json_success(
		array(
			'html'    => $html,
			'page'    => $page,
			'max'     => absint( $query->max_num_pages ),
			'hasMore' => $page < absint( $query->max_num_pages ),
		)
	);
}
add_action( 'wp_ajax_reactpress_blog_load_more', 'reactpress_blog_ajax_load_more' );
add_action( 'wp_ajax_nopriv_reactpress_blog_load_more', 'reactpress_blog_ajax_load_more' );

/**
 * Colorize category term links inside post cards.
 *
 * @since 1.1.0
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_colorize_post_terms( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || 'core/post-terms' !== $block['blockName'] ) {
		return $block_content;
	}

	$term = isset( $block['attrs']['term'] ) ? $block['attrs']['term'] : 'category';
	if ( 'category' !== $term || false === strpos( $block_content, '<a' ) ) {
		return $block_content;
	}

	static $category_index_map = null;
	if ( null === $category_index_map ) {
		$category_index_map = array();
		$all                = get_categories(
			array(
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);
		foreach ( array_values( $all ) as $i => $cat ) {
			$category_index_map[ $cat->term_id ] = $i;
		}
	}

	return preg_replace_callback(
		'/<a\b([^>]*)>(.*?)<\/a>/s',
		static function ( $matches ) use ( $category_index_map ) {
			$attrs = $matches[1];
			$label = $matches[2];
			$index = 0;

			if ( preg_match( '/href=("|\')(.*?)\1/', $attrs, $href_match ) ) {
				$path = wp_parse_url( $href_match[2], PHP_URL_PATH );
				$slug = $path ? basename( untrailingslashit( (string) $path ) ) : '';
				if ( $slug ) {
					$term = get_term_by( 'slug', $slug, 'category' );
					if ( $term && ! is_wp_error( $term ) && isset( $category_index_map[ $term->term_id ] ) ) {
						$index = $category_index_map[ $term->term_id ];
					}
				}
			}

			$style = reactpress_blog_tag_style_attr( $index );
			$icon  = reactpress_blog_icon( 'folder' );

			if ( false !== strpos( $attrs, 'class=' ) ) {
				$attrs = preg_replace( '/class=("|\')(.*?)\1/', 'class=$1rp-category-tag $2$1', $attrs, 1 );
			} else {
				$attrs .= ' class="rp-category-tag"';
			}

			if ( false !== strpos( $attrs, 'style=' ) ) {
				$attrs = preg_replace( '/style=("|\')(.*?)\1/', 'style=$1' . $style . ' $2$1', $attrs, 1 );
			} else {
				$attrs .= ' style="' . esc_attr( $style ) . '"';
			}

			return '<a' . $attrs . '>' . $icon . '<span>' . $label . '</span></a>';
		},
		$block_content
	);
}
add_filter( 'render_block', 'reactpress_blog_colorize_post_terms', 10, 2 );

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

/**
 * Default ReactPress logo when no custom logo is set.
 *
 * @since 1.1.0
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_default_site_logo( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || 'core/site-logo' !== $block['blockName'] ) {
		return $block_content;
	}

	if ( has_custom_logo() && trim( $block_content ) ) {
		return $block_content;
	}

	$logo = get_template_directory_uri() . '/assets/images/logo.svg';
	$home = home_url( '/' );
	$name = get_bloginfo( 'name' );

	return sprintf(
		'<div class="wp-block-site-logo"><a href="%1$s" class="custom-logo-link rp-header-logo-link" rel="home" aria-label="%2$s"><img src="%3$s" class="custom-logo" alt="%2$s" width="159" height="48" decoding="async" /></a></div>',
		esc_url( $home ),
		esc_attr( $name ),
		esc_url( $logo )
	);
}
add_filter( 'render_block', 'reactpress_blog_default_site_logo', 10, 2 );

/**
 * Featured image fallback for post cards without a thumbnail.
 *
 * @since 1.1.0
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_featured_image_fallback( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || 'core/post-featured-image' !== $block['blockName'] ) {
		return $block_content;
	}

	$class = isset( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	if ( false === strpos( $class, 'rp-post-card__cover' ) ) {
		return $block_content;
	}

	if ( has_post_thumbnail() && false !== strpos( $block_content, '<img' ) ) {
		return $block_content;
	}

	$logo = get_template_directory_uri() . '/assets/images/logo.svg';
	$link = get_permalink();

	return sprintf(
		'<figure class="wp-block-post-featured-image rp-post-card__cover rp-post-card__cover--fallback"><a href="%1$s"><img src="%2$s" alt="" width="200" height="114" loading="lazy" decoding="async" /></a></figure>',
		esc_url( $link ),
		esc_url( $logo )
	);
}
add_filter( 'render_block', 'reactpress_blog_featured_image_fallback', 15, 2 );

/**
 * Force search blocks to span full container width.
 *
 * @since 1.3.2
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_full_width_search( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || 'core/search' !== $block['blockName'] || ! $block_content ) {
		return $block_content;
	}

	if ( false === strpos( $block_content, 'wp-block-search' ) ) {
		return $block_content;
	}

	if ( false === strpos( $block_content, 'rp-search-form' ) ) {
		$block_content = preg_replace(
			'/class=("|\')([^"\']*wp-block-search[^"\']*)\1/',
			'class=$1$2 rp-search-form$1',
			$block_content,
			1
		);
	}

	$block_content = preg_replace_callback(
		'/<((?:form|div)\b[^>]*\bwp-block-search\b[^>]*)>/i',
		static function ( $matches ) {
			$attrs = $matches[1];
			if ( preg_match( '/\bstyle=("|\')(.*?)\1/i', $attrs, $style_match ) ) {
				$quote = $style_match[1];
				$style = preg_replace( '/(?:max-)?width\s*:\s*[^;]+;?/i', '', $style_match[2] );
				$style = 'width:100%;max-width:100%;' . trim( $style, " \t;" );
				$attrs = preg_replace(
					'/\bstyle=("|\')(.*?)\1/i',
					'style=' . $quote . esc_attr( $style ) . $quote,
					$attrs,
					1
				);
			} else {
				$attrs .= ' style="width:100%;max-width:100%"';
			}
			return '<' . $attrs . '>';
		},
		$block_content,
		1
	);

	return $block_content;
}
add_filter( 'render_block', 'reactpress_blog_full_width_search', 20, 2 );
