/* ============================================================
   RESERVATION.JS — Live MongoDB Room Loading & Booking Submit
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
  const apiBase = window.DORMIWAY_API_BASE ||
    ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');

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
    const summaryGuestFee = document.getElementById('summaryGuestFee');
    const summaryNights = document.getElementById('summaryNights');
    const summaryTotal = document.getElementById('summaryTotal');

    const today = new Date().toISOString().split('T')[0];
    checkinEl.min = today;

    const params = new URLSearchParams(window.location.search);
    if (params.get('checkin')) checkinEl.value = params.get('checkin');
    if (params.get('checkout')) checkoutEl.value = params.get('checkout');
    if (params.get('guests') && guestsEl) {
      guestsEl.value = params.get('guests') === '4+' ? '4' : params.get('guests');
    }

    // Pre-fill signed-in user info
    if (window.DormiwayUserAuth) {
      const user = window.DormiwayUserAuth.getUser();
      if (user) {
        const fullName = [user.firstName, user.lastName].filter((v) => v && v !== '-').join(' ') || user.name || '';
        if (fullName && !nameEl.value) nameEl.value = fullName;
        if (user.email && !emailEl.value) emailEl.value = user.email;
        if (user.phone && !phoneEl.value) phoneEl.value = user.phone;
      }
    }

    let roomsMap = {};

    async function loadRoomsFromApi() {
      try {
        const res = await fetch(`${apiBase}/api/rooms?limit=100`);
        if (!res.ok) return;
        const data = await res.json();
        const rooms = data.rooms || [];
        if (!rooms.length) return;

        roomEl.innerHTML = '';
        roomsMap = {};
        rooms.forEach((r) => {
          const nightly = Number(r.price ?? r.price_per_night ?? 0);
          roomsMap[r.id] = r;
          const opt = document.createElement('option');
          opt.value = r.id;
          opt.textContent = `${r.name} ($${nightly} / night)`;
          roomEl.appendChild(opt);
        });

        const paramRoom = params.get('room') || params.get('roomType');
        if (paramRoom) {
          for (let i = 0; i < roomEl.options.length; i++) {
            if (roomEl.options[i].textContent.toLowerCase().includes(paramRoom.toLowerCase())) {
              roomEl.selectedIndex = i;
              break;
            }
          }
        }
      } catch (e) {
        // Fallback to static options if offline
      }
      updateSummary();
    }

    function getSelectedRoomInfo() {
      const val = roomEl.value;
      if (roomsMap[val]) {
        return {
          id: val,
          name: roomsMap[val].name,
          rate: Number(roomsMap[val].price ?? roomsMap[val].price_per_night ?? 0),
        };
      }
      const parts = val.split('|');
      return {
        id: null,
        name: parts[0] || 'Suite',
        rate: Number(parts[1] || 0),
      };
    }

    function updateSummary() {
      const info = getSelectedRoomInfo();
      const guestCount = parseInt(guestsEl.value, 10) || 1;
      let nights = 1;
      if (checkinEl.value && checkoutEl.value && checkoutEl.value > checkinEl.value) {
        const diffMs = new Date(checkoutEl.value) - new Date(checkinEl.value);
        nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      const baseTotal = info.rate * nights;
      const guestFee = Math.round(baseTotal * Math.max(0, guestCount - 1) * 0.25);
      const total = baseTotal + guestFee;

      summaryRoomName.textContent = info.name;
      summaryRate.textContent = '$' + info.rate;
      if (summaryGuestFee) summaryGuestFee.textContent = '$' + guestFee;
      summaryNights.textContent = String(nights);
      summaryTotal.textContent = '$' + total;
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
    guestsEl.addEventListener('change', updateSummary);

    await loadRoomsFromApi();

    resForm.addEventListener('submit', async function (e) {
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

      const info = getSelectedRoomInfo();
      const token = window.DormiwayUserAuth?.getToken();
      const guestCount = parseInt(guestsEl.value, 10) || 1;
      const submitBtn = resForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (!info.id || !token) {
          throw new Error('Unable to connect to room catalog. Please refresh and sign in again.');
        }

        const res = await fetch(`${apiBase}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomId: info.id,
            checkInDate: checkinEl.value,
            checkOutDate: checkoutEl.value,
            guests: guestCount,
            specialRequests: requestsEl.value.trim(),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          window.DormiwayUserAuth?.clearSession();
          window.location.replace('signin.html');
          return;
        }
        if (!res.ok) {
          throw new Error(data.message || 'Could not complete reservation.');
        }

        const bookingSummary = {
          ref: data.bookingNumber,
          guestName: nameEl.value.trim(),
          guestEmail: emailEl.value.trim(),
          guestPhone: phoneEl.value.trim(),
          roomName: info.name,
          checkin: data.checkInDate,
          checkout: data.checkOutDate,
          guests: String(data.guests),
          nights: data.nights,
          total: '$' + Number(data.totalPrice || 0).toLocaleString(),
          requests: data.specialRequests || '',
        };

        localStorage.setItem('dormiway_last_booking', JSON.stringify(bookingSummary));
        window.location.href = 'confirmation.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = false;
      }
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
