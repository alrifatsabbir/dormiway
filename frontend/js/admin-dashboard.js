/* ============================================================
   ADMIN-DASHBOARD.JS — Live MongoDB Dashboard Overview
   ============================================================ */
'use strict';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getApiBase() {
  if (window.DORMIWAY_API_BASE) return window.DORMIWAY_API_BASE;
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:3001' : '';
}

function setAdminIdentity() {
  const admin = window.DormiwayAdminAuth?.getAdmin();
  if (!admin) return;

  const name = admin.name || 'Admin';
  const firstName = name.split(' ')[0];
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const headline = document.getElementById('welcomeHeadline');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const topbarAvatar = document.getElementById('topbarAvatar');

  if (headline) headline.textContent = `${greeting}, ${firstName}.`;
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;
}

function setDates() {
  const now = new Date();
  const topnavDate = document.getElementById('topnavDate');
  const welcomeDate = document.getElementById('welcomeDate');
  if (topnavDate) topnavDate.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  if (welcomeDate) welcomeDate.textContent = `Today, ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function renderChart(occupancyRate) {
  const canvas = document.getElementById('growthChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = labels.map((_, idx) => (idx === labels.length - 1 ? Number(occupancyRate || 0) : 0));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Occupancy %',
          data: values,
          borderColor: '#1A1714',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#1A1714',
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(232,226,216,0.5)' }, border: { display: false } },
        y: { min: 0, max: 100, ticks: { stepSize: 25, callback: (v) => v + '%' }, grid: { color: 'rgba(232,226,216,0.5)' }, border: { display: false } },
      },
    },
  });
}

function renderArrivalsTable(checkIns) {
  const tbody = document.getElementById('arrivalsTableBody');
  if (!tbody) return;

  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-xs text-[#9C948B]">No upcoming arrivals found in the database.</td></tr>';
    return;
  }

  tbody.innerHTML = checkIns
    .map((row) => {
      const guestName = row.guestName || [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email || 'Guest';
      const checkIn = row.checkInDate || row.check_in_date || '—';
      return `
        <tr class="border-b border-[#F3EFE9]">
          <td class="py-3 pr-4 font-medium text-[#1A1714]">${escHtml(guestName)}</td>
          <td class="py-3 pr-4 text-[#6B6460]">${escHtml(row.roomName || 'Suite')}</td>
          <td class="py-3 pr-4 text-[#6B6460]">${escHtml(checkIn)}</td>
          <td class="py-3"><span class="inline-block rounded-full bg-[#F5EFE0] px-2.5 py-0.5 text-[11px] font-medium text-[#7A6248] capitalize">${escHtml(row.status || 'pending')}</span></td>
        </tr>
      `;
    })
    .join('');
}

async function loadDashboardData() {
  const token = window.DormiwayAdminAuth?.getToken();
  if (!token) return;

  const base = getApiBase();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [overviewRes, checkinsRes] = await Promise.all([
      fetch(`${base}/api/admin/dashboard/overview`, { headers }),
      fetch(`${base}/api/admin/dashboard/upcoming-checkins?days=7`, { headers }),
    ]);

    if (overviewRes.status === 401 || overviewRes.status === 403) {
      window.DormiwayAdminAuth.logout();
      return;
    }

    const overview = overviewRes.ok ? await overviewRes.json() : {};
    const checkinsData = checkinsRes.ok ? await checkinsRes.json() : { checkIns: [] };

    const setStat = (key, val) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = val;
    };
    const setSub = (key, val) => {
      const el = document.querySelector(`[data-sub="${key}"]`);
      if (el) el.textContent = val;
    };

    const occRate = Number(overview.occupancyRate || 0);
    setStat('occupancy', `${occRate}%`);
    setSub('occupancySub', `${overview.occupiedRooms || 0} occupied rooms`);

    setStat('arrivals', String(overview.todayCheckIns || 0));
    setSub('arrivalsSub', `Total bookings: ${overview.totalBookings || 0}`);

    setStat('departures', String(overview.todayCheckOuts || 0));
    setSub('guestsSub', `Registered guests: ${overview.totalGuests || 0}`);

    setStat('revenue', `$${Number(overview.totalRevenue || 0).toLocaleString()}`);
    setSub('revenueSub', `Pending payments: ${overview.pendingPayments || 0}`);

    const totalRooms = Number(overview.totalRooms || 0);
    const occupiedRooms = Number(overview.occupiedRooms || 0);
    const availableRooms = Number(overview.availableRooms || 0);

    document.getElementById('statTotalRooms').textContent = String(totalRooms);
    document.getElementById('statOccupiedRooms').textContent = String(occupiedRooms);
    document.getElementById('statAvailableRooms').textContent = String(availableRooms);

    const occPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const availPct = totalRooms > 0 ? 100 - occPct : 100;
    document.getElementById('barOccupied').style.width = `${occPct}%`;
    document.getElementById('barAvailable').style.width = `${availPct}%`;

    renderChart(occRate);
    renderArrivalsTable(checkinsData.checkIns || []);
  } catch (err) {
    const syncEl = document.getElementById('syncStatus');
    if (syncEl) syncEl.textContent = 'Backend offline — start server on port 3001';
    renderChart(0);
    renderArrivalsTable([]);
  }
}

function initSidebar() {
  const mobileBtn = document.getElementById('sidebarToggle');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const sidebar = document.getElementById('sidebar');
  const logoutBtn = document.getElementById('adminLogoutBtn');

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

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => window.DormiwayAdminAuth?.logout());
  }
  document.querySelectorAll('[data-admin-logout]').forEach((btn) => {
    btn.addEventListener('click', () => window.DormiwayAdminAuth?.logout());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setAdminIdentity();
  setDates();
  initSidebar();
  loadDashboardData();
});
