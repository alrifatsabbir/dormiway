/* ============================================================
   USER-DASHBOARD.JS — Live User Portal (Profile, Bookings, Payments)
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = window.DormiwayUserAuth;
  if (!auth || !auth.isSignedIn()) return;

  const apiBase = window.DORMIWAY_API_BASE ||
    ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  async function apiFetch(path, options = {}) {
    const token = auth.getToken();
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options.headers || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );
    const res = await fetch(`${apiBase}${path}`, Object.assign({}, options, { headers }));
    if (res.status === 401 || res.status === 403) {
      auth.clearSession();
      window.location.replace('signin.html');
      throw new Error('Session expired');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => navMobile.classList.toggle('open'));
  }

  // Sign out
  document.getElementById('userSignOutBtn')?.addEventListener('click', () => {
    auth.clearSession();
    window.location.href = 'index.html';
  });

  let currentUserId = null;

  async function loadProfile() {
    const me = await apiFetch('/api/users/me');
    currentUserId = me.id;
    const fullName = [me.firstName, me.lastName].filter((v) => v && v !== '-').join(' ') || 'Guest';
    document.getElementById('userWelcome').textContent = `Welcome back, ${me.firstName || fullName}.`;
    document.getElementById('userEmailLabel').textContent = me.email || '';

    document.getElementById('profFirst').value = me.firstName || '';
    document.getElementById('profLast').value = me.lastName === '-' ? '' : (me.lastName || '');
    document.getElementById('profPhone').value = me.phone || '';
    document.getElementById('profNationality').value = me.nationality || '';
    document.getElementById('profPassport').value = me.passportNumber || '';
  }

  async function loadBookings() {
    const tbody = document.getElementById('userBookingsBody');
    try {
      const data = await apiFetch('/api/bookings');
      const bookings = data.bookings || [];
      document.getElementById('statBookings').textContent = String(bookings.length);
      document.getElementById('statUpcoming').textContent = String(
        bookings.filter((b) => ['pending', 'confirmed', 'checked_in'].includes(b.status)).length
      );

      if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-xs text-[#9C948B]">You have no reservations yet.</td></tr>';
        return;
      }

      tbody.innerHTML = bookings
        .map((b) => {
          const canCancel = ['pending', 'confirmed'].includes(b.status);
          const bookingNo = b.bookingNumber || b.booking_number || '—';
          const checkIn = b.checkInDate || b.check_in_date || '—';
          const checkOut = b.checkOutDate || b.check_out_date || '—';
          const total = Number(b.totalPrice ?? b.total_price ?? 0);
          return `
            <tr class="border-b border-[#F3EFE9]">
              <td class="py-3 pr-4 font-medium">${esc(bookingNo)}</td>
              <td class="py-3 pr-4 text-[#6B6460]">${esc(b.roomName || 'Suite')}</td>
              <td class="py-3 pr-4 text-xs text-[#6B6460]">${esc(checkIn)} → ${esc(checkOut)}</td>
              <td class="py-3 pr-4 font-medium">$${total.toLocaleString()}</td>
              <td class="py-3 pr-4"><span class="rounded-full bg-[#F5EFE0] px-2.5 py-0.5 text-[11px] font-medium text-[#7A6248] capitalize">${esc(b.status)}</span></td>
              <td class="py-3 text-right">
                ${canCancel ? `<button data-cancel-booking="${esc(b.id)}" class="cursor-pointer text-xs text-red-700 hover:underline">Cancel</button>` : '—'}
              </td>
            </tr>
          `;
        })
        .join('');

      tbody.querySelectorAll('[data-cancel-booking]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Cancel this reservation?')) return;
          try {
            await apiFetch(`/api/bookings/${encodeURIComponent(btn.getAttribute('data-cancel-booking'))}/cancel`, { method: 'PUT' });
            loadBookings();
          } catch (err) {
            alert(err.message);
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  async function loadPayments() {
    if (!currentUserId) return;
    const tbody = document.getElementById('userPaymentsBody');
    try {
      const data = await apiFetch(`/api/payments/user/${encodeURIComponent(currentUserId)}/payments`);
      const payments = data.payments || [];
      document.getElementById('statPayments').textContent = String(payments.length);

      if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-xs text-[#9C948B]">No payments recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = payments
        .map((p) => `
          <tr class="border-b border-[#F3EFE9]">
            <td class="py-3 pr-4 font-medium">${esc(p.transactionId || p.transaction_id || '—')}</td>
            <td class="py-3 pr-4 text-[#6B6460]">${esc(p.bookingNumber || p.booking_number || '—')}</td>
            <td class="py-3 pr-4 text-[#6B6460]">${esc(p.roomName || 'Suite')}</td>
            <td class="py-3 pr-4 font-medium">$${Number(p.amount || 0).toLocaleString()}</td>
            <td class="py-3"><span class="rounded-full bg-[#F5EFE0] px-2.5 py-0.5 text-[11px] font-medium text-[#7A6248] capitalize">${esc(p.status)}</span></td>
          </tr>
        `)
        .join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    const msgEl = document.getElementById('profileMsg');
    msgEl.classList.add('hidden');

    try {
      await apiFetch(`/api/users/${encodeURIComponent(currentUserId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: document.getElementById('profFirst').value.trim(),
          lastName: document.getElementById('profLast').value.trim() || '-',
          phone: document.getElementById('profPhone').value.trim(),
          nationality: document.getElementById('profNationality').value.trim(),
          passportNumber: document.getElementById('profPassport').value.trim(),
        }),
      });
      msgEl.textContent = 'Profile updated successfully.';
      msgEl.className = 'text-xs text-emerald-700';
      loadProfile();
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = 'text-xs text-red-700';
    }
  });

  try {
    await loadProfile();
    await Promise.all([loadBookings(), loadPayments()]);
  } catch (err) {
    // handled by apiFetch
  }
});

