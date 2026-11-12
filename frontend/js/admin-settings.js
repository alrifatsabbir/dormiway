/* ============================================================
   ADMIN-SETTINGS.JS — Live Admin Profile from /api/admin/me
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { apiFetch } = window.DormiwayAdmin;
  try {
    const me = await apiFetch('/api/admin/me');
    document.getElementById('stName').textContent = me.name || '—';
    document.getElementById('stEmail').textContent = me.email || '—';
    document.getElementById('stRole').textContent = me.role || 'admin';
  } catch (err) {
    const cached = window.DormiwayAdminAuth?.getAdmin();
    if (cached) {
      document.getElementById('stName').textContent = cached.name || '—';
      document.getElementById('stEmail').textContent = cached.email || '—';
      document.getElementById('stRole').textContent = cached.role || 'admin';
    }
  }
});
