/* ============================================================
   ANIMATIONS.JS — Animation System Manager for Dormiway
   
   Features:
   - Intersection Observer for scroll-reveal animations
   - Scroll direction detection (for navbar smart hide/reveal)
   - Stagger utilities for grouped animations
   - Reduced-motion accessibility
   - Mobile device detection and optimization
   ============================================================ */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────
     1. INTERSECTION OBSERVER SETUP
     ─────────────────────────────────────────────────────── */

  function initScrollRevealAnimations() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      console.log('[Dormiway Animations] Intersection Observer not supported, showing all animations immediately');
      // Fallback: Show all animated elements immediately
      document.querySelectorAll('[data-animation]').forEach(function (el) {
        el.classList.add('animate--visible');
      });
      return;
    }

    var elements = document.querySelectorAll('[data-animation]:not(.hero *)');
    console.log('[Dormiway Animations] Found ' + elements.length + ' elements to animate on scroll');

    // Create observer with 10% threshold
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Element is in viewport - trigger animation
            var element = entry.target;
            var delay = element.getAttribute('data-animation-delay') || 0;

            // Apply animation with delay
            setTimeout(function () {
              console.log('[Dormiway Animations] Animating element:', element.className);
              element.classList.add('animate--visible');
            }, parseInt(delay));

            // Stop observing this element (one-time animation)
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    // Observe all elements with data-animation attribute
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ───────────────────────────────────────────────────────
     2. HERO SECTION ENTRANCE ANIMATIONS
     ─────────────────────────────────────────────────────── */

  function initHeroAnimations() {
    var heroEyebrow = document.querySelector('.hero__eyebrow');
    var heroHeadline = document.querySelector('.hero__headline');
    var heroSub = document.querySelector('.hero__sub');
    var heroButton = document.querySelector('.hero__content .btn');
    var heroTagline = document.querySelector('.hero__bottom-tagline');
    var heroScroll = document.querySelector('.hero__scroll-link');

    if (!heroEyebrow) {
      console.log('[Dormiway Animations] No hero section found');
      return; // No hero section on this page
    }

    console.log('[Dormiway Animations] Hero section found, initializing entrance animations');

    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      console.log('[Dormiway Animations] Reduced motion detected, skipping animations');
      // Show all instantly without animation
      [heroEyebrow, heroHeadline, heroSub, heroButton, heroTagline, heroScroll].forEach(
        function (el) {
          if (el) el.classList.add('animate--visible');
        }
      );
      return;
    }

    // Staggered entrance sequence
    var sequence = [
      { element: heroEyebrow, delay: 100 },
      { element: heroHeadline, delay: 300 },
      { element: heroSub, delay: 400 },
      { element: heroButton, delay: 500 },
      { element: heroTagline, delay: 600 },
      { element: heroScroll, delay: 600 }
    ];

    sequence.forEach(function (item) {
      if (item.element) {
        setTimeout(function () {
          console.log('[Dormiway Animations] Adding animate--visible to hero element after ' + item.delay + 'ms');
          item.element.classList.add('animate--visible');
        }, item.delay);
      }
    });
  }

  /* ───────────────────────────────────────────────────────
     3. SCROLL DIRECTION DETECTION
     ─────────────────────────────────────────────────────── */

  function initScrollDirectionDetection() {
    var lastScrollY = 0;
    var ticking = false;
    var scrollThreshold = 10; // Pixels to detect scroll direction

    function updateScrollDirection() {
      var currentScrollY = window.scrollY;

      // Determine scroll direction
      if (currentScrollY > lastScrollY + scrollThreshold) {
        // Scrolling DOWN
        document.documentElement.setAttribute('data-scroll-direction', 'down');
      } else if (currentScrollY < lastScrollY - scrollThreshold) {
        // Scrolling UP
        document.documentElement.setAttribute('data-scroll-direction', 'up');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    // Use requestAnimationFrame for better performance
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateScrollDirection);
          ticking = true;
        }
      },
      { passive: true }
    );

    // Initialize on page load
    updateScrollDirection();
  }

  /* ───────────────────────────────────────────────────────
     4. SMART NAVBAR HIDE/REVEAL
     ─────────────────────────────────────────────────────── */

  function initSmartNavbar() {
    // Find header on any page
    function getHeader() {
      return (
        document.getElementById('navbar') ||
        document.getElementById('roomsHeader') ||
        document.getElementById('reservationHeader') ||
        document.getElementById('header') ||
        document.getElementById('authHeader') ||
        document.getElementById('loginHeader')
      );
    }

    var header = getHeader();
    if (!header) return;

    var lastScrollY = 0;
    var ticking = false;
    var scrollThreshold = 4; // Pixels from top considered "at top"
    var minScrollDelta = 5; // Minimum pixels scrolled to trigger direction change

    function updateNavbarVisibility() {
      var currentScrollY = window.scrollY;
      var scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // At the very top - show navbar
      if (currentScrollY <= scrollThreshold) {
        header.classList.remove('nav-hidden');
      }
      // Only process scroll events with significant movement
      else if (scrollDelta >= minScrollDelta) {
        if (currentScrollY > lastScrollY) {
          // Scrolling DOWN - hide navbar
          header.classList.add('nav-hidden');
        } else {
          // Scrolling UP - show navbar
          header.classList.remove('nav-hidden');
        }
        lastScrollY = currentScrollY;
      }
    }

    // Use requestAnimationFrame for smooth, throttled scroll handling
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            updateNavbarVisibility();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    // Set initial state on page load
    updateNavbarVisibility();
  }

  /* ───────────────────────────────────────────────────────
     5. SMOOTH SCROLL ANCHOR HANDLING
     ─────────────────────────────────────────────────────── */

  function initSmoothScrollAnchors() {
    // Get navbar height for scroll offset
    function getNavbarHeight() {
      var navbar = document.querySelector('.navbar, .header, .rooms-header');
      if (navbar && navbar.offsetHeight) {
        return navbar.offsetHeight;
      }
      return 80; // Default fallback
    }

    // Handle internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return; // Skip empty anchors

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          var navbarHeight = getNavbarHeight();
          var targetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

          // Smooth scroll to target
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ───────────────────────────────────────────────────────
     6. REDUCED MOTION PREFERENCE CHECK
     ─────────────────────────────────────────────────────── */

  function checkReducedMotionPreference() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Add class to document for CSS to handle
      document.documentElement.classList.add('prefers-reduced-motion');
    }

    // Listen for changes in preference
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addListener(function (mq) {
        if (mq.matches) {
          document.documentElement.classList.add('prefers-reduced-motion');
        } else {
          document.documentElement.classList.remove('prefers-reduced-motion');
        }
      });
  }

  /* ───────────────────────────────────────────────────────
     7. PAGE TRANSITION ANIMATION (View Transitions API)
     ─────────────────────────────────────────────────────── */

  function initPageTransitions() {
    // Check if View Transitions API is supported
    if (!('startViewTransition' in document)) {
      return; // Fallback to default navigation
    }

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');

      // Check if link is internal and not special
      if (
        link &&
        link.hostname === location.hostname &&
        !link.target &&
        !link.hasAttribute('data-no-transition')
      ) {
        e.preventDefault();

        // Use View Transitions API for smooth page transition
        document.startViewTransition(function () {
          location.href = link.href;
        });
      }
    });
  }

  /* ───────────────────────────────────────────────────────
     8. INITIALIZATION
     ─────────────────────────────────────────────────────── */

  function init() {
    console.log('[Dormiway Animations] Starting animation system...');
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        console.log('[Dormiway Animations] DOM ready, initializing...');
        runAnimationSystem();
      });
    } else {
      console.log('[Dormiway Animations] DOM already loaded, initializing...');
      runAnimationSystem();
    }

    function runAnimationSystem() {
      checkReducedMotionPreference();
      console.log('[Dormiway Animations] Reduced motion check done');
      
      initScrollDirectionDetection();
      console.log('[Dormiway Animations] Scroll direction detection initialized');
      
      initSmartNavbar();
      console.log('[Dormiway Animations] Smart navbar initialized');
      
      initHeroAnimations();
      console.log('[Dormiway Animations] Hero animations initialized');
      
      initScrollRevealAnimations();
      console.log('[Dormiway Animations] Scroll reveal animations initialized');
      
      initSmoothScrollAnchors();
      console.log('[Dormiway Animations] Smooth scroll anchors initialized');
      
      initPageTransitions();
      console.log('[Dormiway Animations] Page transitions initialized');
      
      console.log('[Dormiway Animations] ✓ All animations ready!');
    }
  }

  // Start animations system
  console.log('[Dormiway Animations] Animation system loading...');
  init();
})();
