<?php
/**
 * Title: Home feed
 * Slug: reactpress-blog/home-feed
 * Categories: reactpress-blog, query, posts
 * Inserter: yes
 * Description: Category filter plus horizontal post cards matching ReactPress.
 *
 * @package ReactPress_Blog
 */

$per_page = absint( get_theme_mod( 'reactpress_blog_posts_per_page', get_option( 'posts_per_page', 10 ) ) );
if ( $per_page < 1 ) {
	$per_page = 10;
}
?>
<!-- wp:group {"className":"rp-feed","layout":{"type":"default"}} -->
<div class="wp-block-group rp-feed">
	<!-- wp:group {"className":"rp-dynamic rp-dynamic--category-menu","layout":{"type":"default"},"metadata":{"name":"Category Menu"}} -->
	<div class="wp-block-group rp-dynamic rp-dynamic--category-menu"></div>
	<!-- /wp:group -->

	<!-- wp:group {"className":"rp-feed__list","layout":{"type":"default"}} -->
	<div class="wp-block-group rp-feed__list">
		<!-- wp:query {"queryId":11,"query":{"perPage":<?php echo (int) $per_page; ?>,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"exclude","inherit":true},"enhancedPagination":false,"layout":{"type":"default"}} -->
		<div class="wp-block-query">
			<!-- wp:post-template {"className":"rp-article-list","style":{"spacing":{"blockGap":"1rem"}}} -->
				<!-- wp:group {"tagName":"article","className":"rp-post-card","layout":{"type":"default"}} -->
				<article class="wp-block-group rp-post-card">
					<!-- wp:post-featured-image {"isLink":true,"sizeSlug":"medium","className":"rp-post-card__cover"} /-->

					<!-- wp:group {"className":"rp-post-card__body","layout":{"type":"default"}} -->
					<div class="wp-block-group rp-post-card__body">
						<!-- wp:group {"className":"rp-post-card__header","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between","verticalAlignment":"top"},"style":{"spacing":{"blockGap":"0.5rem"}}} -->
						<div class="wp-block-group rp-post-card__header">
							<!-- wp:post-title {"isLink":true,"fontSize":"medium"} /-->
							<!-- wp:post-terms {"term":"category","separator":"","fontSize":"small"} /-->
						</div>
						<!-- /wp:group -->

						<!-- wp:post-excerpt {"moreText":"","showMoreOnNewLine":false,"excerptLength":28,"fontSize":"small"} /-->

						<!-- wp:group {"className":"rp-post-meta","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between"},"style":{"spacing":{"blockGap":"0.75rem"}}} -->
						<div class="wp-block-group rp-post-meta">
							<!-- wp:group {"className":"rp-dynamic rp-dynamic--card-stats","layout":{"type":"default"},"metadata":{"name":"Card Stats"}} -->
							<div class="wp-block-group rp-dynamic rp-dynamic--card-stats"></div>
							<!-- /wp:group -->

							<!-- wp:group {"className":"rp-post-meta__right","layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"},"style":{"spacing":{"blockGap":"0.35rem"}}} -->
							<div class="wp-block-group rp-post-meta__right">
								<!-- wp:post-date {"format":"Y-m-d","fontSize":"small"} /-->
							</div>
							<!-- /wp:group -->
						</div>
						<!-- /wp:group -->
					</div>
					<!-- /wp:group -->
				</article>
				<!-- /wp:group -->
			<!-- /wp:post-template -->

			<!-- wp:query-no-results -->
				<!-- wp:group {"className":"rp-widget-panel","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"2rem","bottom":"2rem","left":"1.5rem","right":"1.5rem"}}}} -->
				<div class="wp-block-group rp-widget-panel" style="padding-top:2rem;padding-right:1.5rem;padding-bottom:2rem;padding-left:1.5rem">
					<!-- wp:paragraph {"align":"center","textColor":"foreground-muted"} -->
					<p class="has-text-align-center has-foreground-muted-color has-text-color"><?php echo esc_html__( 'No posts found.', 'reactpress-blog' ); ?></p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:group -->
			<!-- /wp:query-no-results -->

			<!-- wp:group {"className":"rp-dynamic rp-dynamic--infinite-scroll","layout":{"type":"default"},"metadata":{"name":"Infinite Scroll"}} -->
			<div class="wp-block-group rp-dynamic rp-dynamic--infinite-scroll"></div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:query -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
