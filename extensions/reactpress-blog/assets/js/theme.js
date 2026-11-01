/**
 * ReactPress Blog — progressive enhancements.
 * Sticky header, theme toggle, search modal, carousel, mobile menu, tag cloud, back-to-top.
 */
(function () {
	'use strict';

	var THEME_KEY = 'reactpress-blog-theme';

	function onReady(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	function getStoredTheme() {
		try {
			return window.localStorage.getItem(THEME_KEY);
		} catch (e) {
			return null;
		}
	}

	function setStoredTheme(value) {
		try {
			window.localStorage.setItem(THEME_KEY, value);
		} catch (e) {
			/* ignore */
		}
	}

	function applyTheme(mode) {
		var isDark = mode === 'dark';
		document.documentElement.classList.toggle('rp-dark', isDark);
		document.body.classList.toggle('rp-dark', isDark);
		document.body.classList.toggle('dark', isDark);
		document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
	}

	function initThemeToggle() {
		var stored = getStoredTheme();
		if (stored === 'dark' || stored === 'light') {
			applyTheme(stored);
		} else if (document.documentElement.classList.contains('rp-dark')) {
			applyTheme('dark');
		}

		document.querySelectorAll('[data-rp-theme-toggle]').forEach(function (button) {
			button.addEventListener('click', function () {
				var next = document.documentElement.classList.contains('rp-dark') ? 'light' : 'dark';
				applyTheme(next);
				setStoredTheme(next);
			});
		});
	}

	function initStickyHeader() {
		var header = document.querySelector('.rp-header');
		var bar = document.querySelector('.rp-header-bar') || header;
		if (!header || !bar) {
			return;
		}

		var beforeY = 0;
		var ticking = false;

		function update() {
			var y = window.scrollY || 0;
			var affixed = y > 0;
			var visible = beforeY >= y;

			header.classList.toggle('is-affixed', affixed);
			bar.classList.toggle('is-affixed', affixed);
			header.classList.toggle('is-affix-visible', affixed && visible);
			bar.classList.toggle('is-affix-visible', affixed && visible);
			document.documentElement.style.setProperty(
				'--rp-header-offset',
				affixed && visible ? '64px' : '0px'
			);

			beforeY = y;
			ticking = false;
		}

		window.addEventListener(
			'scroll',
			function () {
				if (!ticking) {
					window.requestAnimationFrame(update);
					ticking = true;
				}
			},
			{ passive: true }
		);

		update();
	}

	function initMobileMenu() {
		var header = document.querySelector('.rp-header');
		var toggle = document.querySelector('[data-rp-menu-toggle]');
		if (!header || !toggle) {
			return;
		}

		toggle.addEventListener('click', function () {
			var open = header.classList.toggle('is-menu-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			document.body.style.overflow = open ? 'hidden' : '';
		});

		document.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') {
				return;
			}
			if (document.querySelector('[data-rp-search-modal].is-open')) {
				return;
			}
			header.classList.remove('is-menu-open');
			toggle.setAttribute('aria-expanded', 'false');
			document.body.style.overflow = '';
		});
	}

	function initSearchModal() {
		var modal = document.querySelector('[data-rp-search-modal]');
		if (!modal) {
			return;
		}

		var input = modal.querySelector('[data-rp-search-input]');
		var openers = document.querySelectorAll('[data-rp-search-open]');
		var closers = modal.querySelectorAll('[data-rp-search-close]');
		var lastFocus = null;

		function isOpen() {
			return modal.classList.contains('is-open');
		}

		function closeMobileMenu() {
			var header = document.querySelector('.rp-header');
			var toggle = document.querySelector('[data-rp-menu-toggle]');
			if (!header) {
				return;
			}
			header.classList.remove('is-menu-open');
			if (toggle) {
				toggle.setAttribute('aria-expanded', 'false');
			}
		}

		function open() {
			if (isOpen()) {
				return;
			}
			lastFocus = document.activeElement;
			closeMobileMenu();
			modal.hidden = false;
			// Force reflow so the open transition runs.
			void modal.offsetWidth;
			modal.classList.add('is-open');
			document.body.style.overflow = 'hidden';
			if (input) {
				window.requestAnimationFrame(function () {
					input.focus();
					input.select();
				});
			}
		}

		function close() {
			if (!isOpen()) {
				return;
			}
			modal.classList.remove('is-open');
			document.body.style.overflow = '';
			window.setTimeout(function () {
				if (!isOpen()) {
					modal.hidden = true;
				}
			}, 200);
			if (lastFocus && typeof lastFocus.focus === 'function') {
				lastFocus.focus();
			}
			lastFocus = null;
		}

		openers.forEach(function (button) {
			button.addEventListener('click', function (event) {
				event.preventDefault();
				open();
			});
		});

		closers.forEach(function (el) {
			el.addEventListener('click', function (event) {
				event.preventDefault();
				close();
			});
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && isOpen()) {
				event.preventDefault();
				close();
			}
		});

		modal.addEventListener('submit', function (event) {
			if (!input) {
				return;
			}
			var query = (input.value || '').trim();
			if (!query) {
				event.preventDefault();
				input.focus();
			}
		});
	}

	function initCarousel(root) {
		var slides = Array.prototype.slice.call(root.querySelectorAll('.rp-carousel__slide'));
		if (slides.length <= 1) {
			return;
		}

		var dots = Array.prototype.slice.call(root.querySelectorAll('[data-rp-carousel-dot]'));
		var prev = root.querySelector('[data-rp-carousel-prev]');
		var next = root.querySelector('[data-rp-carousel-next]');
		var progress = root.querySelector('[data-rp-carousel-progress]');
		var active = 0;
		var timer = null;
		var paused = false;
		var autoplayMs = 5000;

		function restartProgress() {
			if (!progress) {
				return;
			}
			var clone = progress.cloneNode(true);
			progress.parentNode.replaceChild(clone, progress);
			progress = clone;
		}

		function setActive(index) {
			active = ((index % slides.length) + slides.length) % slides.length;
			slides.forEach(function (slide, i) {
				var on = i === active;
				slide.classList.toggle('is-active', on);
				slide.setAttribute('aria-hidden', on ? 'false' : 'true');
				var link = slide.querySelector('.rp-carousel__link');
				if (link) {
					link.tabIndex = on ? 0 : -1;
				}
			});
			dots.forEach(function (dot, i) {
				var on = i === active;
				dot.classList.toggle('is-active', on);
				dot.setAttribute('aria-selected', on ? 'true' : 'false');
				var pip = dot.querySelector('.rp-carousel-dot');
				if (pip) {
					pip.classList.toggle('is-active', on);
				}
			});
			restartProgress();
		}

		function clearTimer() {
			if (timer) {
				window.clearInterval(timer);
				timer = null;
			}
		}

		function startTimer() {
			clearTimer();
			if (paused || slides.length <= 1) {
				return;
			}
			timer = window.setInterval(function () {
				setActive(active + 1);
			}, autoplayMs);
		}

		if (prev) {
			prev.addEventListener('click', function () {
				setActive(active - 1);
				startTimer();
			});
		}
		if (next) {
			next.addEventListener('click', function () {
				setActive(active + 1);
				startTimer();
			});
		}
		dots.forEach(function (dot) {
			dot.addEventListener('click', function () {
				var index = parseInt(dot.getAttribute('data-rp-carousel-dot'), 10);
				if (!isNaN(index)) {
					setActive(index);
					startTimer();
				}
			});
		});

		root.addEventListener('mouseenter', function () {
			paused = true;
			root.classList.add('is-paused');
			clearTimer();
		});
		root.addEventListener('mouseleave', function () {
			paused = false;
			root.classList.remove('is-paused');
			startTimer();
		});
		root.addEventListener('focusin', function () {
			paused = true;
			root.classList.add('is-paused');
			clearTimer();
		});
		root.addEventListener('focusout', function (event) {
			if (!root.contains(event.relatedTarget)) {
				paused = false;
				root.classList.remove('is-paused');
				startTimer();
			}
		});

		setActive(0);
		startTimer();
	}

	function initCarousels() {
		document.querySelectorAll('[data-rp-carousel]').forEach(initCarousel);
	}

	/**
	 * Lightweight 3D tag cloud (ported from ReactPress TagCloudEngine).
	 */
	function TagCloud(container) {
		this.oDiv = container;
		this.aA = container.getElementsByTagName('a');
		this.mcList = [];
		this.radius = 90;
		this.d = 200;
		this.dtr = Math.PI / 180;
		this.tSpeed = 11;
		this.size = 200;
		this.mouseX = 0;
		this.mouseY = 10;
		this.howElliptical = 1;
		this.distr = true;
		this.rafId = null;
		this.sa = 0;
		this.ca = 0;
		this.sb = 0;
		this.cb = 0;
		this.sc = 0;
		this.cc = 0;
	}

	TagCloud.prototype.sineCosine = function (a, b, c) {
		this.sa = Math.sin(a * this.dtr);
		this.ca = Math.cos(a * this.dtr);
		this.sb = Math.sin(b * this.dtr);
		this.cb = Math.cos(b * this.dtr);
		this.sc = Math.sin(c * this.dtr);
		this.cc = Math.cos(c * this.dtr);
	};

	TagCloud.prototype.destroy = function () {
		if (this.rafId != null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		this.mcList = [];
	};

	TagCloud.prototype.positionAll = function () {
		var max = Math.min(this.mcList.length, this.aA.length);
		var i;
		for (i = 0; i < max; i++) {
			var el = this.aA[i];
			var phi;
			var theta;
			if (this.distr) {
				phi = Math.acos(-1 + (2 * (i + 1) - 1) / max);
				theta = Math.sqrt(max * Math.PI) * phi;
			} else {
				phi = Math.random() * Math.PI;
				theta = Math.random() * (2 * Math.PI);
			}
			this.mcList[i].cx = this.radius * Math.cos(theta) * Math.sin(phi);
			this.mcList[i].cy = this.radius * Math.sin(theta) * Math.sin(phi);
			this.mcList[i].cz = this.radius * Math.cos(phi);
			el.style.left =
				this.mcList[i].cx + this.oDiv.offsetWidth / 2 - this.mcList[i].offsetWidth / 2 + 'px';
			el.style.top =
				this.mcList[i].cy + this.oDiv.offsetHeight / 2 - this.mcList[i].offsetHeight / 2 + 'px';
		}
	};

	TagCloud.prototype.doPosition = function () {
		var l = this.oDiv.offsetWidth / 2;
		var t = this.oDiv.offsetHeight / 2;
		var count = Math.min(this.mcList.length, this.aA.length);
		var i;
		for (i = 0; i < count; i++) {
			if (this.mcList[i].on) {
				continue;
			}
			var el = this.aA[i];
			if (this.mcList[i].alpha > 0.1) {
				el.style.display = '';
			} else {
				el.style.display = 'none';
				continue;
			}
			el.style.left = this.mcList[i].cx + l - this.mcList[i].offsetWidth / 2 + 'px';
			el.style.top = this.mcList[i].cy + t - this.mcList[i].offsetHeight / 2 + 'px';
			el.style.opacity = '1';
			el.style.zIndex = String(this.mcList[i].zIndex);
		}
	};

	TagCloud.prototype.update = function () {
		var self = this;
		var a = (Math.min(Math.max(-this.mouseY, -this.size), this.size) / this.radius) * this.tSpeed;
		var b = (-Math.min(Math.max(-this.mouseX, -this.size), this.size) / this.radius) * this.tSpeed;

		if (Math.abs(a) > 0.01 || Math.abs(b) > 0.01) {
			this.sineCosine(a, b, 0);
			var i;
			for (i = 0; i < this.mcList.length; i++) {
				if (this.mcList[i].on) {
					continue;
				}
				var rx1 = this.mcList[i].cx;
				var ry1 = this.mcList[i].cy * this.ca + this.mcList[i].cz * -this.sa;
				var rz1 = this.mcList[i].cy * this.sa + this.mcList[i].cz * this.ca;
				var rx2 = rx1 * this.cb + rz1 * this.sb;
				var ry2 = ry1;
				var rz2 = rx1 * -this.sb + rz1 * this.cb;
				var rx3 = rx2 * this.cc + ry2 * -this.sc;
				var ry3 = rx2 * this.sc + ry2 * this.cc;
				var rz3 = rz2;

				this.mcList[i].cx = rx3;
				this.mcList[i].cy = ry3;
				this.mcList[i].cz = rz3;

				var per = this.d / (this.d + rz3);
				this.mcList[i].x = this.howElliptical * rx3 * per - this.howElliptical * 2;
				this.mcList[i].y = ry3 * per;
				this.mcList[i].scale = per;

				var alpha = per;
				alpha = (alpha - 0.6) * (10 / 6);
				this.mcList[i].alpha = alpha * alpha * alpha - 0.2;
				this.mcList[i].zIndex = Math.ceil(100 - Math.floor(this.mcList[i].cz));
			}
			this.doPosition();
		}

		this.rafId = requestAnimationFrame(function () {
			self.update();
		});
	};

	TagCloud.prototype.init = function () {
		var self = this;
		this.destroy();
		if (!this.aA.length) {
			return;
		}

		var i;
		for (i = 0; i < this.aA.length; i++) {
			(function (el, index) {
				var meta = {
					on: false,
					offsetWidth: el.offsetWidth,
					offsetHeight: el.offsetHeight,
					cx: 0,
					cy: 0,
					cz: 0,
					x: 0,
					y: 0,
					scale: 1,
					alpha: 1,
					zIndex: 0,
				};
				el.onmouseover = function () {
					meta.on = true;
					el.style.zIndex = '9999';
					el.style.color = '#fff';
					el.style.padding = '5px 10px';
					el.style.opacity = '1';
				};
				el.onmouseout = function () {
					meta.on = false;
					el.style.zIndex = String(meta.zIndex);
					el.style.padding = '5px 8px';
					el.style.opacity = '1';
				};
				self.mcList[index] = meta;
			})(this.aA[i], i);
		}

		this.sineCosine(0, 0, 0);
		this.positionAll();
		this.doPosition();
		this.oDiv.classList.add('is-ready');
		this.rafId = requestAnimationFrame(function () {
			self.update();
		});
	};

	function initTagClouds() {
		document.querySelectorAll('[data-rp-tag-cloud]').forEach(function (el) {
			if (el.dataset.rpTagCloudReady === '1') {
				return;
			}
			if (!el.getElementsByTagName('a').length || el.offsetWidth === 0) {
				return;
			}
			el.dataset.rpTagCloudReady = '1';
			new TagCloud(el).init();
		});
	}

	function initBackToTop() {
		var button = document.querySelector('.rp-back-to-top');
		if (!button) {
			button = document.createElement('button');
			button.type = 'button';
			button.className = 'rp-back-to-top';
			button.setAttribute('aria-label', 'Back to top');
			button.innerHTML =
				'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5l7 7h-4v7H9v-7H5l7-7z" fill="currentColor"/></svg>';
			document.body.appendChild(button);
		}

		var ticking = false;

		function update() {
			if (window.scrollY > 480) {
				button.classList.add('is-visible');
			} else {
				button.classList.remove('is-visible');
			}
			ticking = false;
		}

		window.addEventListener(
			'scroll',
			function () {
				if (!ticking) {
					window.requestAnimationFrame(update);
					ticking = true;
				}
			},
			{ passive: true }
		);

		button.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});

		update();
	}

	function getConfig() {
		return window.reactpressBlog || {};
	}

	function findArticleList(root) {
		var query = root.closest('.wp-block-query') || document;
		return (
			query.querySelector('.rp-article-list') ||
			query.querySelector('.wp-block-post-template') ||
			document.querySelector('.rp-feed .rp-article-list')
		);
	}

	function normalizePath(url) {
		try {
			var parsed = new URL(url, window.location.origin);
			var path = parsed.pathname.replace(/\/+$/, '');
			return path || '/';
		} catch (e) {
			return '/';
		}
	}

	function initNavActiveState() {
		var current = normalizePath(window.location.href);
		var nodes = document.querySelectorAll(
			'.rp-header-nav .wp-block-navigation-item, .rp-mobile-drawer .wp-block-navigation-item'
		);
		if (!nodes.length) {
			return;
		}

		var best = null;
		var bestLen = -1;

		nodes.forEach(function (item) {
			var link = item.querySelector('a[href]');
			if (!link) {
				return;
			}
			var href = normalizePath(link.href);
			var match = href === current || (href !== '/' && current.indexOf(href + '/') === 0);
			if (match && href.length > bestLen) {
				best = item;
				bestLen = href.length;
			}
		});

		nodes.forEach(function (item) {
			var link = item.querySelector('a[href]');
			var on = item === best;
			item.classList.toggle('is-active', on);
			item.classList.toggle('current-menu-item', on);
			if (link) {
				if (on) {
					link.setAttribute('aria-current', 'page');
				} else {
					link.removeAttribute('aria-current');
				}
			}
		});
	}

	function shouldPlaceFooterInSidebar(hasMore, itemCount, pageSize) {
		return !!hasMore || itemCount >= pageSize;
	}

	function refreshFooterPlacement() {
		var infinite = document.querySelector('[data-rp-infinite-scroll]');
		var list =
			(infinite && findArticleList(infinite)) ||
			document.querySelector('.rp-feed .rp-article-list') ||
			document.querySelector('.rp-feed .wp-block-post-template');
		var footer = document.querySelector('[data-rp-site-footer]');
		var sidebarAbout = document.querySelector('[data-rp-about="sidebar"]');

		if (!footer && !sidebarAbout) {
			return;
		}

		var pageSize = 10;
		var hasMore = false;
		if (infinite) {
			pageSize = parseInt(infinite.getAttribute('data-page-size') || '10', 10) || 10;
			hasMore = infinite.getAttribute('data-has-more') === '1';
		}

		var itemCount = list ? list.querySelectorAll('.rp-post-card, .wp-block-post').length : 0;
		var inSidebar = shouldPlaceFooterInSidebar(hasMore, itemCount, pageSize);

		if (sidebarAbout) {
			sidebarAbout.hidden = !inSidebar;
		}
		if (footer) {
			footer.hidden = inSidebar;
		}
	}

	function initInfiniteScroll() {
		var config = getConfig();
		if (config.infinite === false) {
			return;
		}

		document.querySelectorAll('[data-rp-infinite-scroll]').forEach(function (root) {
			if (root.dataset.rpInfiniteReady === '1') {
				return;
			}
			root.dataset.rpInfiniteReady = '1';

			var sentinel = root.querySelector('[data-rp-infinite-sentinel]');
			var status = root.querySelector('[data-rp-infinite-status]');
			var end = root.querySelector('[data-rp-infinite-end]');
			var list = findArticleList(root);
			if (!sentinel || !list) {
				return;
			}

			var page = parseInt(root.getAttribute('data-page') || '1', 10) || 1;
			var hasMore = root.getAttribute('data-has-more') === '1';
			var loading = false;
			var i18n = config.i18n || {};

			function setStatus(visible, label) {
				if (!status) {
					return;
				}
				status.hidden = !visible;
				var labelEl = status.querySelector('.rp-infinite-scroll__label');
				if (labelEl && label) {
					labelEl.textContent = label;
				}
			}

			function setEnded() {
				hasMore = false;
				root.setAttribute('data-has-more', '0');
				setStatus(false);
				if (end) {
					end.hidden = false;
				}
				if (observer) {
					observer.disconnect();
				}
			}

			function loadNext() {
				if (loading || !hasMore) {
					return;
				}
				loading = true;
				setStatus(true, i18n.loading || 'Loading more…');

				var nextPage = page + 1;
				var params = new URLSearchParams();
				params.set('action', 'reactpress_blog_load_more');
				params.set('nonce', config.nonce || '');
				params.set('page', String(nextPage));
				params.set('category', root.getAttribute('data-category') || '');
				params.set('tag', root.getAttribute('data-tag') || '');
				params.set('search', root.getAttribute('data-search') || '');
				params.set('author', root.getAttribute('data-author') || '');
				params.set('year', root.getAttribute('data-year') || '');
				params.set('month', root.getAttribute('data-month') || '');

				var url = (config.ajaxUrl || '/wp-admin/admin-ajax.php') + '?' + params.toString();

				fetch(url, { credentials: 'same-origin' })
					.then(function (response) {
						if (!response.ok) {
							throw new Error('network');
						}
						return response.json();
					})
					.then(function (payload) {
						if (!payload || !payload.success || !payload.data) {
							throw new Error('payload');
						}
						var data = payload.data;
						if (data.html) {
							var wrap = document.createElement('div');
							wrap.innerHTML = data.html;
							while (wrap.firstChild) {
								list.appendChild(wrap.firstChild);
							}
						}
						page = data.page || nextPage;
						root.setAttribute('data-page', String(page));
						hasMore = !!data.hasMore;
						root.setAttribute('data-has-more', hasMore ? '1' : '0');
						refreshFooterPlacement();
						if (!hasMore) {
							setEnded();
						} else {
							setStatus(false);
						}
					})
					.catch(function () {
						setStatus(true, i18n.loadError || 'Could not load more posts.');
						hasMore = false;
					})
					.finally(function () {
						loading = false;
					});
			}

			if (!hasMore) {
				return;
			}

			var observer = new IntersectionObserver(
				function (entries) {
					if (entries[0] && entries[0].isIntersecting) {
						loadNext();
					}
				},
				{ rootMargin: '240px 0px', threshold: 0 }
			);

			observer.observe(sentinel);
		});
	}

	onReady(function () {
		initThemeToggle();
		initStickyHeader();
		initMobileMenu();
		initNavActiveState();
		initSearchModal();
		initCarousels();
		initTagClouds();
		initBackToTop();
		initInfiniteScroll();
		refreshFooterPlacement();
	});
})();
