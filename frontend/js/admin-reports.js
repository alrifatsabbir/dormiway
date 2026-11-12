/* ============================================================
   ADMIN-REPORTS.JS — Live Reports from MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { apiFetch } = window.DormiwayAdmin;
  try {
    const data = await apiFetch('/api/admin/dashboard/overview');
    document.getElementById('rpRevenue').textContent = `$${Number(data.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('rpBookings').textContent = String(data.totalBookings || 0);
    document.getElementById('rpOccupancy').textContent = `${Number(data.occupancyRate || 0)}%`;
    document.getElementById('rpGuests').textContent = String(data.totalGuests || 0);
  } catch (err) {
    // Keep zeroed defaults if offline
  }
});
