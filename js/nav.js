// ============================================================
// js/nav.js — Sidebar navigazione admin
// ============================================================

import { auth, signOut } from './firebase.js';
import { getCurrentUser } from './auth.js';

/**
 * initNav()
 * Inietta la sidebar nel div#sidebar e imposta logout + utente attivo.
 * Chiama questa funzione su ogni pagina admin dopo checkAuth().
 */
export async function initNav() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  const navItems = [
    {
      href: 'dashboard.html',
      label: 'Dashboard',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
               <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
             </svg>`
    },
    {
      href: 'anagrafica.html',
      label: 'Anagrafica',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
               <circle cx="9" cy="7" r="4"/>
               <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
               <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
             </svg>`
    },
    {
      href: 'calendario-admin.html',
      label: 'Calendario',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
               <line x1="16" y1="2" x2="16" y2="6"/>
               <line x1="8" y1="2" x2="8" y2="6"/>
               <line x1="3" y1="10" x2="21" y2="10"/>
             </svg>`
    },
    {
      href: 'messaggi.html',
      label: 'Messaggi',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
             </svg>`
    },
    {
      href: 'impostazioni.html',
      label: 'Impostazioni',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="3"/>
               <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
             </svg>`
    }
  ];

  const navHTML = navItems.map(item => {
    const isActive = currentPath === item.href;
    return `
      <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>`;
  }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="pittogramma_Strategica.png" alt="Logo" class="sidebar-logo" />
      <span class="sidebar-title">Gestionale<br>Palestra</span>
    </div>

    <nav class="sidebar-nav">
      ${navHTML}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar" id="userAvatar">–</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name" id="userName">Caricamento…</span>
          <span class="sidebar-user-role">Admin</span>
        </div>
      </div>
      <button class="btn-logout" id="btnLogout" title="Esci">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  `;

  // Popola nome utente
  const user = await getCurrentUser();
  if (user) {
    const nameEl   = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const fullName = `${user.name || ''} ${user.surname || ''}`.trim();
    if (nameEl)   nameEl.textContent   = fullName || user.email || 'Admin';
    if (avatarEl) avatarEl.textContent = (user.name?.[0] || 'A').toUpperCase();
  }

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });
}
