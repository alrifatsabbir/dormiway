/* ============================================================
   RESERVATION.JS — Reservation form, summary & confirmation
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // 1. Sticky header shadow on scroll
  const header = document.getElementById('reservationHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // 2. Mobile navigation toggle
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

  // 3. Newsletter subscription handler
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

  // 4. Reservation Form Logic
  const resForm = document.getElementById('reservationForm');
  if (resForm) {
    const checkinEl = document.getElementById('resCheckin');
    const checkoutEl = document.getElementById('resCheckout');
    const roomEl = document.getElementById('resRoom');
    const guestsEl = document.getElementById('resGuests');
    const nameEl = document.getElementById('resName');
    const emailEl = document.getElementById('resEmail');
    const phoneEl = document.getElementById('resPhone');
    const requestsEl = document.getElementById('resRequests');
    const errorEl = document.getElementById('resError');

    const summaryRoomName = document.getElementById('summaryRoomName');
    const summaryRate = document.getElementById('summaryRate');
    const summaryNights = document.getElementById('summaryNights');
    const summaryTotal = document.getElementById('summaryTotal');

    const today = new Date().toISOString().split('T')[0];
    checkinEl.min = today;

    // Pre-fill from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkin')) checkinEl.value = params.get('checkin');
    if (params.get('checkout')) checkoutEl.value = params.get('checkout');
    if (params.get('guests') && guestsEl) guestsEl.value = params.get('guests');

    const paramRoom = params.get('room') || params.get('roomType');
    if (paramRoom) {
      for (let i = 0; i < roomEl.options.length; i++) {
        if (roomEl.options[i].value.toLowerCase().includes(paramRoom.toLowerCase())) {
          roomEl.selectedIndex = i;
          break;
        }
      }
    }

    // Pre-fill signed-in user info
    if (window.DormiwayUserAuth) {
      const user = window.DormiwayUserAuth.getUser();
      if (user) {
        if (user.name && !nameEl.value) nameEl.value = user.name;
        if (user.email && !emailEl.value) emailEl.value = user.email;
      }
    }

    function updateSummary() {
      const parts = roomEl.value.split('|');
      const roomName = parts[0] || 'Suite';
      const rate = Number(parts[1] || 0);

      let nights = 1;
      if (checkinEl.value && checkoutEl.value && checkoutEl.value > checkinEl.value) {
        const diffMs = new Date(checkoutEl.value) - new Date(checkinEl.value);
        nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      summaryRoomName.textContent = roomName;
      summaryRate.textContent = '$' + rate;
      summaryNights.textContent = String(nights);
      summaryTotal.textContent = '$' + (rate * nights);
    }

    checkinEl.addEventListener('change', function () {
      checkoutEl.min = checkinEl.value;
      if (checkoutEl.value && checkoutEl.value <= checkinEl.value) {
        checkoutEl.value = '';
      }
      updateSummary();
    });
    checkoutEl.addEventListener('change', updateSummary);
    roomEl.addEventListener('change', updateSummary);
    updateSummary();

    resForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.classList.add('hidden');
      errorEl.textContent = '';

      if (!checkinEl.value || !checkoutEl.value || checkoutEl.value <= checkinEl.value) {
        errorEl.textContent = 'Please select valid check-in and check-out dates.';
        errorEl.classList.remove('hidden');
        return;
      }
      if (!nameEl.value.trim() || !emailEl.value.trim() || !phoneEl.value.trim()) {
        errorEl.textContent = 'Please fill in your name, email, and phone number.';
        errorEl.classList.remove('hidden');
        return;
      }

      const parts = roomEl.value.split('|');
      const roomName = parts[0];
      const rate = Number(parts[1] || 0);
      const nights = Math.max(1, Math.round((new Date(checkoutEl.value) - new Date(checkinEl.value)) / (1000 * 60 * 60 * 24)));

      const booking = {
        ref: 'DW-' + Math.floor(100000 + Math.random() * 900000),
        guestName: nameEl.value.trim(),
        guestEmail: emailEl.value.trim(),
        guestPhone: phoneEl.value.trim(),
        roomName: roomName,
        checkin: checkinEl.value,
        checkout: checkoutEl.value,
        guests: guestsEl.value,
        nights: nights,
        total: '$' + (rate * nights),
        requests: requestsEl.value.trim(),
      };

      localStorage.setItem('dormiway_last_booking', JSON.stringify(booking));
      window.location.href = 'confirmation.html';
    });
  }

  // 5. Confirmation Page Population
  const confRef = document.getElementById('confRef');
  if (confRef) {
    try {
      const booking = JSON.parse(localStorage.getItem('dormiway_last_booking') || 'null');
      if (booking) {
        confRef.textContent = booking.ref;
        document.getElementById('confGuest').textContent = booking.guestName;
        document.getElementById('confRoom').textContent = booking.roomName;
        document.getElementById('confCheckin').textContent = booking.checkin;
        document.getElementById('confCheckout').textContent = booking.checkout;
        document.getElementById('confGuests').textContent = booking.guests + (booking.guests === '1' ? ' Guest' : ' Guests');
        document.getElementById('confTotal').textContent = booking.total;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

});
