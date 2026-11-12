/* ============================================================
   ADMIN-RESERVATION-DETAIL.JS — Live Reservation Detail
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const card = document.getElementById('detailCard');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    card.innerHTML = '<p class="text-xs text-[#9C948B]">No reservation ID provided.</p>';
    return;
  }

  try {
    const b = await apiFetch(`/api/bookings/admin/reservations/${encodeURIComponent(id)}`);
    const bookingNo = b.bookingNumber || b.booking_number || '—';
    const roomName = b.room?.name || b.roomName || 'Suite';
    const guestName = b.guest ? [b.guest.firstName, b.guest.lastName].filter((v) => v && v !== '-').join(' ') : 'Guest';
    const guestEmail = b.guest?.email || '—';
    const checkIn = b.checkInDate || b.check_in_date || '—';
    const checkOut = b.checkOutDate || b.check_out_date || '—';
    const total = Number(b.totalPrice ?? b.total_price ?? 0);

    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <div>
          <p class="text-[11px] font-medium tracking-[0.18em] text-[#7A6248] uppercase">Booking</p>
          <h1 class="font-['Cormorant_Garamond',Georgia,serif] text-3xl text-[#1A1714]">${esc(bookingNo)}</h1>
        </div>
        <span class="rounded-full bg-[#F5EFE0] px-3 py-1 text-xs font-medium text-[#7A6248] capitalize">${esc(b.status)}</span>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Guest</span><span class="font-medium">${esc(guestName)} (${esc(guestEmail)})</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Room</span><span class="font-medium">${esc(roomName)}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Check-in</span><span class="font-medium">${esc(checkIn)}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Check-out</span><span class="font-medium">${esc(checkOut)}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Nights</span><span class="font-medium">${Number(b.nights || 1)}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Guests</span><span class="font-medium">${Number(b.guests || 1)}</span></div>
        <div class="flex justify-between border-t border-[#E8E2D8] pt-3 text-base"><span class="font-medium">Total</span><span class="font-semibold text-[#7A6248]">$${total.toLocaleString()}</span></div>
      </div>
    `;
  } catch (err) {
    card.innerHTML = `<p class="text-xs text-red-700">${esc(err.message)}</p>`;
  }
});
