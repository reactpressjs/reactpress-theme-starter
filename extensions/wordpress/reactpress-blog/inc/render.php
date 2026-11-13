<?php
/**
 * Presentation renderers.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
		<div class="rp-footer__about-main" data-rp-about-panel="footer">
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
			<span class="rp-sidebar-widget__icon" aria-hidden="true"><?php echo reactpress_blog_icon( 'bookmark' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
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
		'<span class="rp-card-stats"><span class="rp-card-stats__item" title="%3$s">%1$s<span>%2$s</span></span></span>',
		reactpress_blog_icon( 'comment' ),
		esc_html( (string) $comments ),
		esc_attr__( 'Comments', 'reactpress-blog' )
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
		'<span class="rp-card-stats"><span class="rp-card-stats__item" title="%3$s">%1$s<span>%2$s</span></span></span>',
		reactpress_blog_icon( 'comment' ),
		esc_html( (string) $comments ),
		esc_attr__( 'Comments', 'reactpress-blog' )
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
