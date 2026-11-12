/* ============================================================
   ADMIN-ROOMS.JS — Live Rooms CRUD with MongoDB
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const { apiFetch, esc } = window.DormiwayAdmin;
  const grid = document.getElementById('roomsGrid');
  const modal = document.getElementById('roomModal');
  const openBtn = document.getElementById('openAddRoomBtn');
  const closeBtn = document.getElementById('closeRoomModal');
  const form = document.getElementById('roomForm');

  openBtn?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });
  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  async function loadRooms() {
    try {
      const data = await apiFetch('/api/rooms?limit=100');
      const rooms = data.rooms || [];
      if (!rooms.length) {
        grid.innerHTML = '<p class="col-span-full border border-[#E8E2D8] bg-white py-12 text-center text-xs text-[#9C948B]">No rooms in MongoDB yet. Click "+ Add Room" to create one.</p>';
        return;
      }

      grid.innerHTML = rooms
        .map((r) => `
          <article class="border border-[#E8E2D8] bg-white p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-medium tracking-[0.18em] text-[#7A6248] uppercase">${esc(r.type)}</span>
                <span class="rounded-full bg-[#F5EFE0] px-2.5 py-0.5 text-[11px] font-medium text-[#7A6248]">${(r.available ?? r.is_available) ? 'Available' : 'Unavailable'}</span>
              </div>
              <h2 class="mt-2 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-normal text-[#1A1714]">${esc(r.name)}</h2>
              <p class="mt-1 text-xs text-[#6B6460]">${esc(r.description || 'No description')}</p>
            </div>
            <div class="mt-5 flex items-center justify-between border-t border-[#F3EFE9] pt-4 text-xs">
              <span class="font-medium text-[#1A1714]">$${Number(r.price ?? r.price_per_night ?? 0)} / night · ${r.capacity} guests</span>
              <button data-delete-room="${esc(r.id)}" class="cursor-pointer text-red-700 hover:underline">Delete</button>
            </div>
          </article>
        `)
        .join('');

      grid.querySelectorAll('[data-delete-room]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this room?')) return;
          try {
            await apiFetch(`/api/rooms/${encodeURIComponent(btn.getAttribute('data-delete-room'))}`, { method: 'DELETE' });
            loadRooms();
          } catch (err) {
            alert(err.message);
          }
        });
      });
    } catch (err) {
      grid.innerHTML = `<p class="col-span-full py-10 text-center text-xs text-red-700">${esc(err.message)}</p>`;
    }
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('rmName').value.trim(),
          type: document.getElementById('rmType').value,
          capacity: Number(document.getElementById('rmCapacity').value),
          pricePerNight: Number(document.getElementById('rmPrice').value),
          description: document.getElementById('rmDesc').value.trim(),
        }),
      });
      form.reset();
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      loadRooms();
    } catch (err) {
      alert(err.message);
    }
  });

  loadRooms();
});
