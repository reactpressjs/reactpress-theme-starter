<?php
/**
 * Theme state helpers.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
