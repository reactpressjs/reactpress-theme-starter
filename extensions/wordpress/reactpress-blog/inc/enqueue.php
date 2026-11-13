<?php
/**
 * Styles and scripts.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
				'prev'               => __( 'Previous slide', 'reactpress-blog' ),
				'next'               => __( 'Next slide', 'reactpress-blog' ),
				'themeLight'         => __( 'Switch to light theme', 'reactpress-blog' ),
				'themeDark'          => __( 'Switch to dark theme', 'reactpress-blog' ),
				'search'             => __( 'Search', 'reactpress-blog' ),
				'menuToggle'         => __( 'Toggle menu', 'reactpress-blog' ),
				'backToTop'          => __( 'Back to top', 'reactpress-blog' ),
				'loading'            => __( 'Loading more…', 'reactpress-blog' ),
				'loadMore'           => __( 'Load more', 'reactpress-blog' ),
				'noMore'             => __( 'No more posts', 'reactpress-blog' ),
				'loadError'          => __( 'Could not load more posts.', 'reactpress-blog' ),
				'postingComment'     => __( 'Posting…', 'reactpress-blog' ),
				'commentPosted'      => __( 'Comment posted.', 'reactpress-blog' ),
				'commentModeration'  => __( 'Your comment is awaiting moderation.', 'reactpress-blog' ),
				'commentError'       => __( 'Could not post your comment. Please try again.', 'reactpress-blog' ),
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
