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

define( 'REACTPRESS_BLOG_VERSION', '1.3.13' );
define( 'REACTPRESS_BLOG_DIR', get_template_directory() );
define( 'REACTPRESS_BLOG_URI', get_template_directory_uri() );
define( 'REACTPRESS_BLOG_STATE_OPTION', 'reactpress_blog_state' );

$reactpress_blog_includes = array(
	'state.php',
	'setup.php',
	'enqueue.php',
	'customizer.php',
	'helpers.php',
	'dynamic-slots.php',
	'render.php',
	'ajax.php',
	'filters.php',
);

foreach ( $reactpress_blog_includes as $reactpress_blog_file ) {
	require_once REACTPRESS_BLOG_DIR . '/inc/' . $reactpress_blog_file;
}
