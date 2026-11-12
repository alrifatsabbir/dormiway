/* ============================================================
   ADMIN-PAYMENTS.JS — Live Payments from MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const tbody = document.getElementById('paymentsBody');
  const filterEl = document.getElementById('paymentStatusFilter');

  async function loadPayments() {
    try {
      const status = filterEl?.value || '';
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await apiFetch(`/api/payments/admin/payments${qs}`);
      const payments = data.payments || [];
      if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-xs text-[#9C948B]">No payments recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = payments
        .map((p) => {
          const guest = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Guest';
          return `
            <tr class="border-b border-[#F3EFE9]">
              <td class="py-3 pr-4 font-medium text-[#1A1714]">${esc(p.transaction_id)}</td>
              <td class="py-3 pr-4 text-[#1A1714]">${esc(guest)}</td>
              <td class="py-3 pr-4 text-[#6B6460]">${esc(p.booking_number || '—')}</td>
              <td class="py-3 pr-4 text-[#6B6460] capitalize">${esc(p.payment_method || 'card')}</td>
              <td class="py-3 pr-4 font-medium text-[#1A1714]">$${Number(p.amount || 0).toLocaleString()}</td>
              <td class="py-3 pr-4"><span class="rounded-full bg-[#F5EFE0] px-2.5 py-0.5 text-[11px] font-medium text-[#7A6248] capitalize">${esc(p.status)}</span></td>
              <td class="py-3 text-right"><a href="invoice.html?id=${encodeURIComponent(p.id)}" class="text-xs text-[#7A6248] hover:underline">Invoice →</a></td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  filterEl?.addEventListener('change', loadPayments);
  loadPayments();
});
