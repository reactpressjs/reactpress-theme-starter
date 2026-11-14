<?php
/**
 * Dynamic presentation slots.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
		'rp-dynamic--menu-toggle'     => 'reactpress_blog_render_menu_toggle',
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
