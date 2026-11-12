/* ============================================================
   ADMIN-GUESTS.JS — Live Guests Directory from MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const tbody = document.getElementById('guestsBody');
  const searchEl = document.getElementById('guestSearch');

  async function loadGuests(term = '') {
    try {
      const qs = term ? `?searchTerm=${encodeURIComponent(term)}` : '';
      const data = await apiFetch(`/api/admin/guests${qs}`);
      const guests = data.guests || [];
      if (!guests.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-xs text-[#9C948B]">No guests registered yet.</td></tr>';
        return;
      }

      tbody.innerHTML = guests
        .map((g) => {
          const name = [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest';
          return `
            <tr class="border-b border-[#F3EFE9]">
              <td class="py-3 pr-4 font-medium text-[#1A1714]">${esc(name)}</td>
              <td class="py-3 pr-4 text-[#6B6460]">${esc(g.email)}</td>
              <td class="py-3 pr-4 text-[#6B6460]">${esc(g.phone || '—')}</td>
              <td class="py-3 pr-4 text-[#1A1714]">${Number(g.totalBookings || 0)}</td>
              <td class="py-3 font-medium text-[#1A1714]">$${Number(g.totalSpent || 0).toLocaleString()}</td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  let timer;
  searchEl?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => loadGuests(searchEl.value.trim()), 250);
  });

  loadGuests();
});
