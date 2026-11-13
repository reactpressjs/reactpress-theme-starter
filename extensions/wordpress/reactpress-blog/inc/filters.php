<?php
/**
 * Block and content filters.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Suppress comments blocks embedded in post content.
 *
 * Theme Unit Test (and some demo posts) embed Comments / Comments Form blocks
 * inside the_content. The single template already renders comments once, so
 * those in-content copies produce duplicate forms and titles.
 *
 * @since 1.3.9
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_suppress_embedded_comments( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || ! doing_filter( 'the_content' ) ) {
		return $block_content;
	}

	$blocked = array(
		'core/comments',
		'core/post-comments',
		'core/post-comments-form',
		'core/comments-title',
		'core/comment-template',
		'core/comments-pagination',
	);

	if ( in_array( $block['blockName'], $blocked, true ) ) {
		return '';
	}

	return $block_content;
}
add_filter( 'render_block', 'reactpress_blog_suppress_embedded_comments', 5, 2 );

/**
 * Drop the comments panel shell when core renders nothing inside it.
 *
 * Closed posts with zero comments leave an empty `.rp-comments` group that
 * still has padding/background, which reads as a blank placeholder.
 *
 * @since 1.3.11
 * @param string $block_content Rendered HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function reactpress_blog_hide_empty_comments_panel( $block_content, $block ) {
	if ( empty( $block['attrs']['className'] ) || ! is_string( $block['attrs']['className'] ) ) {
		return $block_content;
	}

	if ( false === strpos( $block['attrs']['className'], 'rp-comments' ) ) {
		return $block_content;
	}

	$plain = trim( wp_strip_all_tags( $block_content ) );
	if ( '' === $plain ) {
		return '';
	}

	return $block_content;
}
add_filter( 'render_block_core/group', 'reactpress_blog_hide_empty_comments_panel', 20, 2 );

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

			return '<a' . $attrs . '>' . $icon . '<span>' . esc_html( wp_strip_all_tags( $label ) ) . '</span></a>';
		},
		$block_content
	);
}
add_filter( 'render_block', 'reactpress_blog_colorize_post_terms', 10, 2 );

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
 * @param string         $block_content Rendered HTML.
 * @param array          $block         Parsed block.
 * @param WP_Block|null  $instance      Block instance (context).
 * @return string
 */
function reactpress_blog_featured_image_fallback( $block_content, $block, $instance = null ) {
	if ( empty( $block['blockName'] ) || 'core/post-featured-image' !== $block['blockName'] ) {
		return $block_content;
	}

	$class = isset( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	if ( false === strpos( $class, 'rp-post-card__cover' ) ) {
		return $block_content;
	}

	$post_id = 0;
	if ( $instance instanceof WP_Block && ! empty( $instance->context['postId'] ) ) {
		$post_id = absint( $instance->context['postId'] );
	} elseif ( ! empty( $block['context']['postId'] ) ) {
		$post_id = absint( $block['context']['postId'] );
	} else {
		$post_id = absint( get_the_ID() );
	}

	if ( $post_id && has_post_thumbnail( $post_id ) && false !== strpos( $block_content, '<img' ) ) {
		return $block_content;
	}

	$logo = get_template_directory_uri() . '/assets/images/logo.svg';
	$link = $post_id ? get_permalink( $post_id ) : get_permalink();

	return sprintf(
		'<figure class="wp-block-post-featured-image rp-post-card__cover rp-post-card__cover--fallback"><a href="%1$s"><img src="%2$s" alt="" width="200" height="114" loading="lazy" decoding="async" /></a></figure>',
		esc_url( $link ? $link : home_url( '/' ) ),
		esc_url( $logo )
	);
}
add_filter( 'render_block', 'reactpress_blog_featured_image_fallback', 15, 3 );

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
