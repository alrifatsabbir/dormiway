/* ============================================================
   AMENITIES-DINING.JS — Client Interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ========================
  // 1. STICKY HEADER SHADOW ON SCROLL
  // ========================
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }


  // ========================
  // 2. MOBILE NAVIGATION DRAWER
  // ========================
  const toggleBtn = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('navMobile');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }


  // ========================
  // 3. NEWSLETTER SUBMISSION HANDLER
  // ========================
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        const originalPlaceholder = input.placeholder;
        input.value = '';
        input.placeholder = 'Thank you for subscribing!';
        setTimeout(function () {
          input.placeholder = originalPlaceholder;
        }, 3500);
      }
    });
  }

});

