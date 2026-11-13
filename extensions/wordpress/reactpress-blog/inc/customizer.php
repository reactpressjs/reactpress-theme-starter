<?php
/**
 * Customizer settings.
 *
 * @package ReactPress_Blog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize checkbox to boolean theme_mod.
 *
 * @since 1.3.0
 * @param mixed $value Raw value.
 * @return bool
 */
function reactpress_blog_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Sanitize posts-per-page setting.
 *
 * @since 1.3.0
 * @param mixed $value Raw value.
 * @return int
 */
function reactpress_blog_sanitize_posts_per_page( $value ) {
	$value = absint( $value );
	if ( $value < 1 ) {
		$value = 10;
	}
	return min( 50, $value );
}

/**
 * Customizer: basic theme configuration.
 *
 * @since 1.1.0
 * @param WP_Customize_Manager $wp_customize Customizer.
 * @return void
 */
function reactpress_blog_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'reactpress_blog_panel',
		array(
			'title'    => __( 'ReactPress Blog', 'reactpress-blog' ),
			'priority' => 160,
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_identity',
		array(
			'title' => __( 'Header & Identity', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_colors',
		array(
			'title' => __( 'Colors', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_section(
		'reactpress_blog_layout',
		array(
			'title' => __( 'Layout & Feed', 'reactpress-blog' ),
			'panel' => 'reactpress_blog_panel',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_github_url',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_github_url',
		array(
			'label'       => __( 'GitHub URL', 'reactpress-blog' ),
			'description' => __( 'Shown as an icon in the site header. Leave empty to hide.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_identity',
			'type'        => 'url',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_show_auth',
		array(
			'default'           => true,
			'sanitize_callback' => 'reactpress_blog_sanitize_checkbox',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_show_auth',
		array(
			'label'   => __( 'Show Login / Register buttons', 'reactpress-blog' ),
			'section' => 'reactpress_blog_identity',
			'type'    => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_footer_info',
		array(
			'default'           => '',
			'sanitize_callback' => 'wp_kses_post',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_footer_info',
		array(
			'label'       => __( 'Footer / About HTML', 'reactpress-blog' ),
			'description' => __( 'Shown under About in the footer and sidebar. Leave empty to use the site tagline / fallback.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_identity',
			'type'        => 'textarea',
		)
	);

	$color_settings = array(
		'reactpress_blog_primary_color'        => array(
			'label'   => __( 'Primary color', 'reactpress-blog' ),
			'default' => '#f44336',
		),
		'reactpress_blog_primary_button_color' => array(
			'label'   => __( 'Primary button color', 'reactpress-blog' ),
			'default' => '#c62828',
		),
		'reactpress_blog_background_color'     => array(
			'label'   => __( 'Background color', 'reactpress-blog' ),
			'default' => '#e7eaee',
		),
		'reactpress_blog_surface_color'        => array(
			'label'   => __( 'Surface (card) color', 'reactpress-blog' ),
			'default' => '#ffffff',
		),
		'reactpress_blog_text_color'           => array(
			'label'   => __( 'Text color', 'reactpress-blog' ),
			'default' => '#1a1a1a',
		),
		'reactpress_blog_link_color'           => array(
			'label'   => __( 'Link color', 'reactpress-blog' ),
			'default' => '#4299e1',
		),
	);

	foreach ( $color_settings as $id => $args ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $args['default'],
				'sanitize_callback' => 'sanitize_hex_color',
				'transport'         => 'refresh',
			)
		);

		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				$id,
				array(
					'label'   => $args['label'],
					'section' => 'reactpress_blog_colors',
				)
			)
		);
	}

	$wp_customize->add_setting(
		'reactpress_blog_infinite_scroll',
		array(
			'default'           => true,
			'sanitize_callback' => 'reactpress_blog_sanitize_checkbox',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_infinite_scroll',
		array(
			'label'       => __( 'Infinite scroll (load more on scroll)', 'reactpress-blog' ),
			'description' => __( 'When disabled, classic pagination is shown.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_posts_per_page',
		array(
			'default'           => absint( get_option( 'posts_per_page', 10 ) ),
			'sanitize_callback' => 'reactpress_blog_sanitize_posts_per_page',
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_posts_per_page',
		array(
			'label'       => __( 'Posts loaded per page', 'reactpress-blog' ),
			'description' => __( 'Used by the home/archive feed and infinite scroll.', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'number',
			'input_attrs' => array(
				'min'  => 1,
				'max'  => 50,
				'step' => 1,
			),
		)
	);

	$wp_customize->add_setting(
		'reactpress_blog_sidebar_width',
		array(
			'default'           => 18,
			'sanitize_callback' => static function ( $value ) {
				$value = absint( $value );
				return min( 28, max( 14, $value ? $value : 18 ) );
			},
		)
	);

	$wp_customize->add_control(
		'reactpress_blog_sidebar_width',
		array(
			'label'       => __( 'Sidebar width (rem)', 'reactpress-blog' ),
			'section'     => 'reactpress_blog_layout',
			'type'        => 'number',
			'input_attrs' => array(
				'min'  => 14,
				'max'  => 28,
				'step' => 1,
			),
		)
	);
}
add_action( 'customize_register', 'reactpress_blog_customize_register' );

/**
 * Build CSS overrides from Customizer settings.
 *
 * @since 1.3.0
 * @return string
 */
function reactpress_blog_get_customizer_css() {
	$map = array(
		'reactpress_blog_primary_color'        => array( '--rp-primary', '--wp--preset--color--primary' ),
		'reactpress_blog_primary_button_color' => array( '--rp-primary-button', '--wp--preset--color--primary-button' ),
		'reactpress_blog_background_color'     => array( '--rp-bg-body', '--wp--preset--color--background' ),
		'reactpress_blog_surface_color'        => array( '--rp-bg-box', '--wp--preset--color--surface' ),
		'reactpress_blog_text_color'           => array( '--rp-text', '--wp--preset--color--foreground' ),
		'reactpress_blog_link_color'           => array( '--rp-link', '--wp--preset--color--link' ),
	);

	$vars = array();
	foreach ( $map as $mod => $css_vars ) {
		$color = get_theme_mod( $mod, '' );
		if ( ! is_string( $color ) || ! sanitize_hex_color( $color ) ) {
			continue;
		}
		foreach ( $css_vars as $css_var ) {
			$vars[] = $css_var . ':' . $color;
		}
	}

	$sidebar = absint( get_theme_mod( 'reactpress_blog_sidebar_width', 18 ) );
	if ( $sidebar >= 14 && $sidebar <= 28 ) {
		$vars[] = '--rp-sidebar-width:' . $sidebar . 'rem';
	}

	if ( ! $vars ) {
		return '';
	}

	return ':root,body{' . implode( ';', $vars ) . ';}';
}
