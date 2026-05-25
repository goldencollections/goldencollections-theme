/**
 * Feelori / Golden Collections Mega Menu Script (v12 - Optimized & Fixed)
 *
 * Key improvements:
 * - Debounced resize handlers for better performance
 * - Cached DOM queries to reduce reflows
 * - requestAnimationFrame scroll handling for smooth sticky header
 * - Focus trap for mobile menu
 * - Mobile accordion via event delegation
 * - Better cart update batching
 * - Enhanced accessibility (ARIA, keyboard)
 */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // ----- CORE ELEMENTS (CACHED) -----
    const megaMenu = document.getElementById('feelori-mega-menu');
    if (!megaMenu) {
      console.warn('Mega menu (#feelori-mega-menu) not found. Script stopped.');
      return;
    }

    const BRAND = document.body.dataset.brand || 'feelori';
    const header = document.querySelector('.header-wrapper') || megaMenu;
    const announcementBar = document.querySelector('.announcement-bar');

    const mobileToggle = megaMenu.querySelector('.feelori-mega-menu__mobile-toggle');
    const mobileContainer = megaMenu.querySelector('.feelori-mega-menu__mobile-container');
    const mobileOverlay = megaMenu.querySelector('.feelori-mega-menu__overlay');
    const mobileCloseButton = megaMenu.querySelector('.feelori-mega-menu__mobile-close');
    const searchSummary = megaMenu.querySelector('.gc-feelori-search-modal-host details-modal summary');

    const desktopMenuItems = megaMenu.querySelectorAll(
      '.feelori-mega-menu__list > .feelori-mega-menu__item'
    );

    const hasVideoBanner =
      document.body.classList.contains('template-index') &&
      document.querySelector('.section-video-banner-cover');

    const baseScrollThreshold = hasVideoBanner ? 100 : 50;
    const MOBILE_BREAKPOINT = 990;
    const HOVER_DELAY = 250;
    const RESIZE_DEBOUNCE = 150;

    // ----- STATE -----
    let lastScrollY = window.scrollY || 0;
    let ticking = false;
    let announcementHeight = 0;
    let focusTrapActive = false;
    let cartUpdateTimeout;

    document.body.classList.add('has-feelori-megamenu');

    // ----- UTILS -----
    function getFocusableElements(container) {
      if (!container) return [];
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      return Array.from(container.querySelectorAll(selectors.join(','))).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
      );
    }

    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    // ----- ANNOUNCEMENT BAR & HEADER HEIGHT -----
    function updateAnnouncementBarHeight() {
      if (!announcementBar) {
        announcementHeight = 0;
        document.documentElement.style.setProperty('--announcement-bar-height', '0px');
        megaMenu.classList.remove('feelori-mega-menu--with-announcement');
        return;
      }

      const height = announcementBar.offsetHeight || 0;
      const hasContent = (announcementBar.textContent || '').trim().length > 0;
      const visible = height > 0 && hasContent;

      announcementHeight = visible ? height : 0;
      document.documentElement.style.setProperty(
        '--announcement-bar-height',
        `${announcementHeight}px`
      );

      megaMenu.classList.toggle('feelori-mega-menu--with-announcement', visible);
    }

    function updateHeaderHeight() {
      if (!header) return;
      const h = header.offsetHeight || 0;
      document.documentElement.style.setProperty('--header-height', `${h}px`);
    }

    function updateDimensions() {
      updateAnnouncementBarHeight();
      updateHeaderHeight();
    }

    // ResizeObserver + debounced fallback
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(
        debounce(() => {
          updateDimensions();
        }, 50)
      );

      if (announcementBar) ro.observe(announcementBar);
      if (header) ro.observe(header);
    } else {
      updateDimensions();
      window.addEventListener(
        'resize',
        debounce(updateDimensions, RESIZE_DEBOUNCE),
        { passive: true }
      );
    }

    // ----- STICKY HEADER (SCROLL + rAF) -----
    function updateStickyHeader(scrollY) {
      const effectiveThreshold = baseScrollThreshold + announcementHeight;

      if (scrollY > effectiveThreshold) {
        megaMenu.classList.add('feelori-mega-menu--fixed');
      } else {
        megaMenu.classList.remove('feelori-mega-menu--fixed');
      }

      // Safety: remove any legacy hide-on-scroll class
      if (megaMenu.classList.contains('hide-on-scroll-down')) {
        megaMenu.classList.remove('hide-on-scroll-down');
      }
    }

    function onScroll() {
      lastScrollY = window.scrollY || 0;
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateStickyHeader(lastScrollY);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ----- MOBILE MENU & FOCUS TRAP -----
    function openMobileMenu() {
      if (!mobileContainer || document.body.classList.contains('mobile-menu-open')) return;

      document.body.classList.add('mobile-menu-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      // Smooth focus timing
      requestAnimationFrame(() => {
        const focusTarget = mobileCloseButton || getFocusableElements(mobileContainer)[0];
        if (focusTarget) focusTarget.focus();
      });

      if (!focusTrapActive) {
        document.addEventListener('keydown', handleFocusTrap);
        focusTrapActive = true;
      }
    }

    function closeMobileMenu() {
      if (!document.body.classList.contains('mobile-menu-open')) return;

      document.body.classList.remove('mobile-menu-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      if (focusTrapActive) {
        document.removeEventListener('keydown', handleFocusTrap);
        focusTrapActive = false;
      }

      if (mobileToggle) {
        requestAnimationFrame(() => mobileToggle.focus());
      }
    }

    function toggleMobileMenu(forceClose) {
      const shouldClose =
        typeof forceClose === 'boolean'
          ? forceClose
          : document.body.classList.contains('mobile-menu-open');

      if (shouldClose) closeMobileMenu();
      else openMobileMenu();
    }

    function openSearchModal() {
      if (!searchSummary) {
        window.location.href = '/search';
        return;
      }

      requestAnimationFrame(() => {
        searchSummary.click();
      });
    }

    function handleFocusTrap(e) {
      if (!document.body.classList.contains('mobile-menu-open') || e.key !== 'Tab') return;
      if (!mobileContainer) return;

      const focusable = getFocusableElements(mobileContainer);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Mobile toggle listeners
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => toggleMobileMenu());
    }

    megaMenu.querySelectorAll('[data-feelori-search-trigger]').forEach((searchTrigger) => {
      searchTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (document.body.classList.contains('mobile-menu-open')) {
          toggleMobileMenu(true);
        }
        openSearchModal();
      });
    });

    if (mobileCloseButton) {
      mobileCloseButton.addEventListener('click', () => toggleMobileMenu(true));
      mobileCloseButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMobileMenu(true);
        }
      });
    }

    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => toggleMobileMenu(true));
    }

    // Global ESC closes mobile
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
        toggleMobileMenu(true);
      }
    });

    // Debounced resize → close mobile when switching to desktop
    window.addEventListener(
      'resize',
      debounce(() => {
        if (window.innerWidth >= MOBILE_BREAKPOINT && document.body.classList.contains('mobile-menu-open')) {
          toggleMobileMenu(true);
        }
      }, RESIZE_DEBOUNCE),
      { passive: true }
    );

    // ----- MOBILE ACCORDION (EVENT DELEGATION) -----
    if (mobileContainer) {
      mobileContainer.addEventListener('click', (e) => {
        const searchTrigger = e.target.closest('[data-feelori-search-trigger]');
        if (searchTrigger) {
          e.preventDefault();
          toggleMobileMenu(true);
          openSearchModal();
          return;
        }

        const toggleButton = e.target.closest('.feelori-mega-menu__mobile-submenu-toggle');
        if (toggleButton) {
          e.preventDefault();
          const item = toggleButton.closest('.feelori-mega-menu__mobile-item');
          if (!item) return;

          const parentList = item.parentElement;
          const isOpening = !item.classList.contains('feelori-mega-menu__mobile-item--active');

          // Close siblings
          parentList
            ?.querySelectorAll(':scope > .feelori-mega-menu__mobile-item--active')
            .forEach((sib) => {
              if (sib !== item) {
                sib.classList.remove('feelori-mega-menu__mobile-item--active');
                const sibButton = sib.querySelector('.feelori-mega-menu__mobile-submenu-toggle');
                if (sibButton) sibButton.setAttribute('aria-expanded', 'false');
              }
            });

          // Toggle current
          item.classList.toggle('feelori-mega-menu__mobile-item--active', isOpening);
          toggleButton.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
          return;
        }

        const link = e.target.closest('.feelori-mega-menu__mobile-link');
        if (!link) return;

        const item = link.closest('.feelori-mega-menu__mobile-item');
        if (!item) return;
        const controlsId = link.getAttribute('aria-controls');

        if (controlsId) {
          e.preventDefault();
          const parentList = item.parentElement;
          const isOpening = !item.classList.contains('feelori-mega-menu__mobile-item--active');

          // Close siblings
          parentList
            ?.querySelectorAll(':scope > .feelori-mega-menu__mobile-item--active')
            .forEach((sib) => {
              if (sib !== item) {
                sib.classList.remove('feelori-mega-menu__mobile-item--active');
                const sibLink = sib.querySelector('.feelori-mega-menu__mobile-link[aria-controls]');
                if (sibLink) sibLink.setAttribute('aria-expanded', 'false');
              }
            });

          // Toggle current
          item.classList.toggle('feelori-mega-menu__mobile-item--active', isOpening);
          link.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
        } else {
          // Regular link → close mobile and navigate
          toggleMobileMenu(true);
        }
      });

      // Keyboard support for accordion
      mobileContainer.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const toggleButton = e.target.closest('.feelori-mega-menu__mobile-submenu-toggle');
        if (toggleButton) {
          e.preventDefault();
          toggleButton.click();
          return;
        }
        const link = e.target.closest('.feelori-mega-menu__mobile-link[aria-controls]');
        if (link) {
          e.preventDefault();
          link.click();
        }
      });
    }

    // ----- DESKTOP MENU (HOVER + KEYBOARD) -----
    function closeAllDesktopDropdowns(exceptItem) {
      desktopMenuItems.forEach((item) => {
        if (item === exceptItem || !item.classList.contains('feelori-mega-menu__item--active')) return;

        item.classList.remove('feelori-mega-menu__item--active');
        const button = item.querySelector('.feelori-mega-menu__submenu-toggle');
        const dropdownId = button?.getAttribute('aria-controls');
        const dropdown = dropdownId ? megaMenu.querySelector('#' + dropdownId) : null;

        if (button) button.setAttribute('aria-expanded', 'false');
        if (dropdown) dropdown.classList.remove('dropdown--visible');
      });
    }

    desktopMenuItems.forEach((item) => {
      const button = item.querySelector('.feelori-mega-menu__submenu-toggle');
      const dropdownId = button?.getAttribute('aria-controls');
      const dropdown = dropdownId ? megaMenu.querySelector('#' + dropdownId) : null;
      let closeTimeout;

      if (!button || !dropdown) return;

      function open() {
        clearTimeout(closeTimeout);
        closeAllDesktopDropdowns(item);
        item.classList.add('feelori-mega-menu__item--active');
        button.setAttribute('aria-expanded', 'true');
        dropdown.classList.add('dropdown--visible');
      }

      function close() {
        item.classList.remove('feelori-mega-menu__item--active');
        button.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('dropdown--visible');
      }

      function scheduleClose() {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(() => {
          close();
        }, HOVER_DELAY);
      }

      // Hover events
      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', scheduleClose);
      dropdown.addEventListener('mouseenter', () => clearTimeout(closeTimeout));
      dropdown.addEventListener('mouseleave', scheduleClose);

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isActive = item.classList.contains('feelori-mega-menu__item--active');

        if (isActive) {
          close();
        } else {
          open();
        }
      });

      // Keyboard
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (!item.classList.contains('feelori-mega-menu__item--active')) {
            open();
          }
          requestAnimationFrame(() => {
            const firstFocusable = getFocusableElements(dropdown)[0];
            if (firstFocusable) firstFocusable.focus();
          });
        } else if (e.key === 'Escape') {
          close();
          button.focus();
        }
      });

      dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          close();
          button.focus();
        }
      });
    });

    // Click outside → close desktop dropdowns
    document.addEventListener('click', (e) => {
      if (!megaMenu.contains(e.target)) {
        closeAllDesktopDropdowns();
      }
    });

    // ----- CART COUNT (DEBOUNCED) -----
    function updateCartCount() {
      clearTimeout(cartUpdateTimeout);
      cartUpdateTimeout = setTimeout(() => {
        fetch('/cart.js')
          .then((res) => {
            if (!res.ok) throw new Error('Cart fetch failed: ' + res.status);
            return res.json();
          })
          .then((cart) => {
            const count = cart?.item_count || 0;
            const elements = megaMenu.querySelectorAll('.feelori-mega-menu__cart-count');

            requestAnimationFrame(() => {
              elements.forEach((el) => {
                el.textContent = count;
                el.style.display = count > 0 ? 'flex' : 'none';
              });
            });
          })
          .catch((err) => console.error('Error updating cart count:', err));
      }, 100);
    }

    document.addEventListener('cart:updated', updateCartCount);

    // ----- INITIALIZE -----
    updateDimensions();
    updateStickyHeader(window.scrollY || 0);
    updateCartCount();

    console.log(`Mega menu initialized (v12-final) for brand: ${BRAND}`);
  });
})();
