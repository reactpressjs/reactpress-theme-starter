<?php
/**
 * AJAX handlers.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
