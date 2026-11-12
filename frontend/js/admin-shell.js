/* ============================================================
   ADMIN-SHELL.JS — Shared sidebar, topbar, API helper & auth
   ============================================================ */
'use strict';

window.DormiwayAdmin = (function () {
  function getApiBase() {
    if (window.DORMIWAY_API_BASE) return window.DORMIWAY_API_BASE;
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3001' : '';
  }

  async function apiFetch(path, options = {}) {
    const token = window.DormiwayAdminAuth?.getToken();
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options.headers || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );

    const res = await fetch(`${getApiBase()}${path}`, Object.assign({}, options, { headers }));
    if (res.status === 401 || res.status === 403) {
      window.DormiwayAdminAuth?.logout();
      throw new Error('Unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initShell() {
    const admin = window.DormiwayAdminAuth?.getAdmin();
    if (admin) {
      const name = admin.name || 'Admin';
      const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
      const sName = document.getElementById('sidebarName');
      const sAv = document.getElementById('sidebarAvatar');
      const tAv = document.getElementById('topbarAvatar');
      if (sName) sName.textContent = name;
      if (sAv) sAv.textContent = initials;
      if (tAv) tAv.textContent = initials;
    }

    const topnavDate = document.getElementById('topnavDate');
    if (topnavDate) {
      topnavDate.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      });
    }

    const mobileBtn = document.getElementById('sidebarToggle');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebar = document.getElementById('sidebar');

    if (collapseBtn && sidebar) {
      if (localStorage.getItem('dormiway_sidebar_collapsed') === 'true') {
        sidebar.classList.add('collapsed');
      }
      collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('dormiway_sidebar_collapsed', sidebar.classList.contains('collapsed'));
      });
    }

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => sidebar.classList.toggle('is-open'));
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
          sidebar.classList.remove('is-open');
        }
      });
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => window.DormiwayAdminAuth?.logout());
    }
    document.querySelectorAll('[data-admin-logout]').forEach((btn) => {
      btn.addEventListener('click', () => window.DormiwayAdminAuth?.logout());
    });
  }

  document.addEventListener('DOMContentLoaded', initShell);

  return { getApiBase, apiFetch, esc };
}());

