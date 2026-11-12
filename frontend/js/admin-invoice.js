/* ============================================================
   ADMIN-INVOICE.JS — Live Payment Invoice from MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const card = document.getElementById('invoiceCard');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    card.innerHTML = '<p class="text-xs text-[#9C948B]">Select a payment from Payments to view its invoice.</p>';
    return;
  }

  try {
    const p = await apiFetch(`/api/payments/admin/payments/${encodeURIComponent(id)}`);
    const guest = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Guest';
    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <div>
          <p class="text-[11px] font-medium tracking-[0.18em] text-[#7A6248] uppercase">Dormiway Invoice</p>
          <h1 class="font-['Cormorant_Garamond',Georgia,serif] text-3xl text-[#1A1714]">${esc(p.transaction_id)}</h1>
        </div>
        <span class="rounded-full bg-[#F5EFE0] px-3 py-1 text-xs font-medium text-[#7A6248] capitalize">${esc(p.status)}</span>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Guest</span><span class="font-medium">${esc(guest)}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Booking #</span><span class="font-medium">${esc(p.booking_number || '—')}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Room</span><span class="font-medium">${esc(p.roomName || 'Suite')}</span></div>
        <div class="flex justify-between py-1"><span class="text-[#6B6460]">Method</span><span class="font-medium capitalize">${esc(p.payment_method || 'card')}</span></div>
        <div class="flex justify-between border-t border-[#E8E2D8] pt-3 text-base"><span class="font-medium">Total Paid</span><span class="font-semibold text-[#7A6248]">$${Number(p.amount || 0).toLocaleString()}</span></div>
      </div>
    `;
  } catch (err) {
    card.innerHTML = `<p class="text-xs text-red-700">${esc(err.message)}</p>`;
  }
});
