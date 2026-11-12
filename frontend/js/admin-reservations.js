/* ============================================================
   ADMIN-RESERVATIONS.JS — Live Reservations from MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const tbody = document.getElementById('reservationsBody');
  const statusFilter = document.getElementById('statusFilter');
  const searchBox = document.getElementById('searchBox');
  let allBookings = [];

  function renderRows(rows) {
    const q = (searchBox?.value || '').trim().toLowerCase();
    const filtered = rows.filter((b) => {
      if (!q) return true;
      const guest = (b.guestName || [b.firstName, b.lastName, b.email].filter(Boolean).join(' ')).toLowerCase();
      const num = String(b.bookingNumber || b.booking_number || '').toLowerCase();
      return (
        num.includes(q) ||
        guest.includes(q) ||
        String(b.roomName || '').toLowerCase().includes(q)
      );
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-xs text-[#9C948B]">No reservations found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered
      .map((b) => {
        const guest = b.guestName || [b.firstName, b.lastName].filter(Boolean).join(' ') || b.email || 'Guest';
        const bookingNo = b.bookingNumber || b.booking_number || '—';
        const checkIn = b.checkInDate || b.check_in_date || '—';
        const checkOut = b.checkOutDate || b.check_out_date || '—';
        const total = Number(b.totalPrice ?? b.total_price ?? 0);
        return `
          <tr class="border-b border-[#F3EFE9]">
            <td class="py-3 pr-4 font-medium text-[#1A1714]">${esc(bookingNo)}</td>
            <td class="py-3 pr-4 text-[#1A1714]">${esc(guest)}</td>
            <td class="py-3 pr-4 text-[#6B6460]">${esc(b.roomName || 'Suite')}</td>
            <td class="py-3 pr-4 text-xs text-[#6B6460]">${esc(checkIn)} → ${esc(checkOut)}</td>
            <td class="py-3 pr-4 font-medium text-[#1A1714]">$${total.toLocaleString()}</td>
            <td class="py-3 pr-4">
              <select data-booking-status="${esc(b.id)}" class="border border-[#E8E2D8] bg-[#FAF8F5] px-2 py-1 text-xs text-[#1A1714]">
                ${['pending', 'confirmed', 'checked_in', 'completed', 'cancelled']
                  .map((s) => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s}</option>`)
                  .join('')}
              </select>
            </td>
            <td class="py-3 text-right">
              <a href="reservation-detail.html?id=${encodeURIComponent(b.id)}" class="text-xs text-[#7A6248] hover:underline">View →</a>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-booking-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-booking-status');
        try {
          await apiFetch(`/api/bookings/admin/reservations/${encodeURIComponent(id)}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: sel.value }),
          });
        } catch (err) {
          alert(err.message);
          load();
        }
      });
    });
  }

  async function load() {
    try {
      const status = statusFilter?.value || '';
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await apiFetch(`/api/bookings/admin/reservations${qs}`);
      allBookings = data.reservations || data.bookings || [];
      renderRows(allBookings);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  statusFilter?.addEventListener('change', load);
  searchBox?.addEventListener('input', () => renderRows(allBookings));
  load();
});
