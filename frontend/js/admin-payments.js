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
          const guest = p.guestName || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Guest';
          const txId = p.transactionId || p.transaction_id || '—';
          const bookingNo = p.bookingNumber || p.booking_number || '—';
          const method = p.paymentMethod || p.payment_method || 'card';
          return `
            <tr class="border-b border-[#F3EFE9]">
              <td class="py-3 pr-4 font-medium text-[#1A1714]">${esc(txId)}</td>
              <td class="py-3 pr-4 text-[#1A1714]">${esc(guest)}</td>
              <td class="py-3 pr-4 text-[#6B6460]">${esc(bookingNo)}</td>
              <td class="py-3 pr-4 text-[#6B6460] capitalize">${esc(method)}</td>
              <td class="py-3 pr-4 font-medium text-[#1A1714]">$${Number(p.amount || 0).toLocaleString()}</td>
              <td class="py-3 pr-4">
                <select data-payment-status="${esc(p.id)}" class="border border-[#E8E2D8] bg-[#FAF8F5] px-2 py-1 text-xs text-[#1A1714]">
                  ${['pending', 'completed', 'failed', 'refunded']
                    .map((s) => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`)
                    .join('')}
                </select>
              </td>
              <td class="py-3 text-right"><a href="invoice.html?id=${encodeURIComponent(p.id)}" class="text-xs text-[#7A6248] hover:underline">Invoice →</a></td>
            </tr>
          `;
        })
        .join('');

      tbody.querySelectorAll('[data-payment-status]').forEach((sel) => {
        sel.addEventListener('change', async () => {
          const id = sel.getAttribute('data-payment-status');
          try {
            await apiFetch(`/api/payments/admin/payments/${encodeURIComponent(id)}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: sel.value }),
            });
          } catch (err) {
            alert(err.message);
            loadPayments();
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-red-700">${esc(err.message)}</td></tr>`;
    }
  }

  filterEl?.addEventListener('change', loadPayments);
  loadPayments();
});
