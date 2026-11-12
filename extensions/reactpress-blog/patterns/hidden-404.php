<?php
/**
 * Title: 404 content
 * Slug: reactpress-blog/hidden-404
 * Categories: reactpress-blog
 * Inserter: no
 *
 * @package ReactPress_Blog
 */

?>
<!-- wp:group {"className":"rp-entry rp-404__card","layout":{"type":"constrained"}} -->
<div class="wp-block-group rp-entry rp-404__card">
	<!-- wp:heading {"level":1,"className":"rp-404__title"} -->
	<h1 class="wp-block-heading rp-404__title"><?php esc_html_e( 'Page not found', 'reactpress-blog' ); ?></h1>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"className":"rp-404__text","textColor":"foreground-muted"} -->
	<p class="rp-404__text has-foreground-muted-color has-text-color"><?php esc_html_e( 'The page you are looking for does not exist or has been moved.', 'reactpress-blog' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:search {"label":"Search","showLabel":false,"width":100,"widthUnit":"%","buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true,"className":"rp-search-form"} /-->

	<!-- wp:paragraph {"className":"rp-404__home","style":{"spacing":{"margin":{"top":"1.25rem"}}}} -->
	<p class="rp-404__home" style="margin-top:1.25rem"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'reactpress-blog' ); ?></a></p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
