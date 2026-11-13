<?php
/**
 * Title: Post card
 * Slug: reactpress-blog/post-card
 * Categories: reactpress-blog, query, posts
 * Block Types: core/post-template
 * Inserter: yes
 * Description: Horizontal ReactPress-style post card.
 *
 * @package ReactPress_Blog
 */

?>
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
