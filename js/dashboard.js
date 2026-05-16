// ============================================================
// js/dashboard.js — Logica Dashboard Admin
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCIYt0tgl0MQbG3KAkpqTg_ZZMykT0w8lw",
  authDomain:        "gestionale-palestra-44dba.firebaseapp.com",
  projectId:         "gestionale-palestra-44dba",
  storageBucket:     "gestionale-palestra-44dba.firebasestorage.app",
  messagingSenderId: "127344006319",
  appId:             "1:127344006319:web:a478ba76a586e8c1b7705a"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth check ───────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'admin') {
    window.location.href = 'index.html'; return;
  }
  document.body.classList.remove('hidden');
  initSidebar(snap.data());
  initDashboard();
});

// ── Sidebar ──────────────────────────────────────────────────
function initSidebar(userData) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const pages = [
    { href:'dashboard.html',       label:'Dashboard',   icon:'grid' },
    { href:'anagrafica.html',      label:'Anagrafica',  icon:'users' },
    { href:'calendario-admin.html',label:'Calendario',  icon:'calendar' },
    { href:'messaggi.html',        label:'Messaggi',    icon:'message' },
    { href:'impostazioni.html',    label:'Impostazioni',icon:'settings' }
  ];
  const icons = {
    grid:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    users:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    message:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  };
  const cur = window.location.pathname.split('/').pop();
  const navHTML = pages.map(p => `
    <a href="${p.href}" class="nav-item${cur===p.href?' active':''}">
      <span class="nav-icon">${icons[p.icon]}</span>
      <span class="nav-label">${p.label}</span>
    </a>`).join('');
  const fullName = `${userData.name||''} ${userData.surname||''}`.trim();
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="pittogramma%20Strategica.png" alt="Logo" class="sidebar-logo"/>
      <span class="sidebar-title">Gestionale<br>Palestra</span>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">${(userData.name?.[0]||'A').toUpperCase()}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">${fullName||'Admin'}</span>
          <span class="sidebar-user-role">Admin</span>
        </div>
      </div>
      <button class="btn-logout" id="btnLogout" title="Esci">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>`;
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });
}

// ── Helpers ──────────────────────────────────────────────────
function toYMD(date) {
  return date.toISOString().split('T')[0];
}

function formatDate(date) {
  return date.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function getDateRange(period, customFrom, customTo) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from, to, label;

  if (period === 'today') {
    from  = today;
    to    = new Date(today.getTime() + 86400000);
    label = 'Oggi, ' + today.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' });
  } else if (period === 'week') {
    const day = today.getDay() || 7;
    from  = new Date(today); from.setDate(today.getDate() - day + 1);
    to    = new Date(from);  to.setDate(from.getDate() + 7);
    label = `${formatDate(from)} → ${formatDate(new Date(to.getTime()-1))}`;
  } else if (period === 'month') {
    from  = new Date(now.getFullYear(), now.getMonth(), 1);
    to    = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    label = today.toLocaleDateString('it-IT', { month:'long', year:'numeric' });
  } else if (period === 'year') {
    from  = new Date(now.getFullYear(), 0, 1);
    to    = new Date(now.getFullYear() + 1, 0, 1);
    label = String(now.getFullYear());
  } else if (period === 'custom' && customFrom && customTo) {
    from  = new Date(customFrom);
    to    = new Date(new Date(customTo).getTime() + 86400000);
    label = `${formatDate(from)} → ${formatDate(new Date(customTo))}`;
  } else {
    from  = today;
    to    = new Date(today.getTime() + 86400000);
    label = 'Oggi';
  }
  return { from, to, label };
}

function timeAgo(ts) {
  if (!ts) return '';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return 'adesso';
  if (diff < 3600)  return `${Math.floor(diff/60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ore fa`;
  return `${Math.floor(diff/86400)} giorni fa`;
}

// ── Init dashboard ───────────────────────────────────────────
let currentPeriod = 'today';
let customFrom    = null;
let customTo      = null;

async function initDashboard() {
  // Data topbar
  document.getElementById('todayDate').textContent =
    new Date().toLocaleDateString('it-IT', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Imposta date default per il picker personalizzato
  const todayStr = toYMD(new Date());
  document.getElementById('dateFrom').value = todayStr;
  document.getElementById('dateTo').value   = todayStr;

  // Pulsanti periodo
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;

      // Mostra/nascondi date picker
      const customRange = document.getElementById('customRange');
      if (currentPeriod === 'custom') {
        customRange.classList.add('visible');
        // Non caricare dati finché l'utente non clicca Applica
        return;
      } else {
        customRange.classList.remove('visible');
        customFrom = null;
        customTo   = null;
      }
      loadAllData();
    });
  });

  // Applica range personalizzato
  document.getElementById('btnApplyRange').addEventListener('click', () => {
    const f = document.getElementById('dateFrom').value;
    const t = document.getElementById('dateTo').value;
    if (!f || !t) { alert('Seleziona entrambe le date.'); return; }
    if (f > t)    { alert('La data "Dal" deve essere precedente alla data "Al".'); return; }
    customFrom = f;
    customTo   = t;
    loadAllData();
  });

  // Pannello laterale
  document.getElementById('btnClosePanel').addEventListener('click', closePanel);
  document.getElementById('panelOverlay').addEventListener('click', closePanel);

  await loadAllData();
}

async function loadAllData() {
  const { from, to, label } = getDateRange(currentPeriod, customFrom, customTo);
  const fromStr = toYMD(from);
  const toStr   = toYMD(to);

  // Mostra etichetta periodo attivo
  document.getElementById('periodLabel').textContent = label;

  // Carica tutto in parallelo
  const [usersSnap, slotsSnap, bookingsSnap, paymentsSnap,
         coursesSnap, roomsSnap, instructorsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'slots')),
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'payments')),
    getDocs(collection(db, 'courses')),
    getDocs(collection(db, 'rooms')),
    getDocs(collection(db, 'instructors'))
  ]);

  const users       = usersSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const slots       = slotsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const bookings    = bookingsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const payments    = paymentsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const courses     = coursesSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const rooms       = roomsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
  const instructors = instructorsSnap.docs.map(d => ({ id:d.id, ...d.data() }));

  const courseMap     = Object.fromEntries(courses.map(c => [c.id, c]));
  const roomMap       = Object.fromEntries(rooms.map(r => [r.id, r]));
  const instructorMap = Object.fromEntries(instructors.map(i => [i.id, i]));
  const userMap       = Object.fromEntries(users.map(u => [u.id, u]));

  const corsisti  = users.filter(u => u.role === 'corsista');
  const slotsP    = slots.filter(s => s.date >= fromStr && s.date < toStr && s.isActive !== false);
  const bookingsC = bookings.filter(b => b.status === 'confirmed');
  const bookingsP = bookingsC.filter(b => slotsP.find(s => s.id === b.slotId));
  const paymentsP = payments.filter(p => {
    const d = p.date?.toDate ? p.date.toDate() : new Date(p.date||0);
    return d >= from && d < to;
  });
  const nuoviP = corsisti.filter(u => {
    const d = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt||0);
    return d >= from && d < to;
  });

  const incassi = paymentsP.reduce((a, p) => a + (p.amount||0), 0);

  let riempTot = 0, riempCount = 0;
  slotsP.forEach(s => {
    const cap  = s.maxCapacity || 1;
    const bks  = bookingsC.filter(b => b.slotId === s.id).length;
    riempTot  += (bks / cap) * 100;
    riempCount++;
  });
  const riempMedio = riempCount > 0 ? Math.round(riempTot / riempCount) : 0;

  // Stat cards
  document.getElementById('statIscritti').textContent     = corsisti.length;
  document.getElementById('statLezioni').textContent      = slotsP.length;
  document.getElementById('statPrenotazioni').textContent = bookingsP.length;
  document.getElementById('statIncassi').textContent      = `€${incassi.toFixed(0)}`;
  document.getElementById('statRiempimento').textContent  = `${riempMedio}%`;
  document.getElementById('statNuovi').textContent        = nuoviP.length;

  renderTodaySlots(slots, bookingsC, courseMap, instructorMap, userMap);
  renderReportCorsi(courses, slotsP, bookingsC, paymentsP);
  renderReportSale(rooms, slotsP, bookingsC, paymentsP);
  renderFeed(bookings, users, slots, payments, courseMap);
  renderAlerts(corsisti, slots);
}

// ── Calendario del giorno ────────────────────────────────────
function renderTodaySlots(slots, bookings, courseMap, instructorMap, userMap) {
  const today      = toYMD(new Date());
  const todaySlots = slots.filter(s => s.date === today && s.isActive !== false)
                          .sort((a,b) => a.hour - b.hour);
  const container  = document.getElementById('todaySlots');

  if (todaySlots.length === 0) {
    container.innerHTML = `<div style="padding:20px 0;text-align:center;color:var(--text-muted);font-size:.82rem;font-style:italic;">Nessuna lezione programmata per oggi.</div>`;
    return;
  }

  container.innerHTML = todaySlots.map(slot => {
    const course     = courseMap[slot.courseId];
    const instructor = instructorMap[slot.instructorId];
    const bks        = bookings.filter(b => b.slotId === slot.id).length;
    const cap        = slot.maxCapacity || 5;
    const pct        = Math.round((bks / cap) * 100);
    const isFull     = bks >= cap;
    const hour       = `${String(slot.hour).padStart(2,'0')}:00`;
    return `
      <div class="slot-row" data-slotid="${slot.id}"
           data-hour="${hour}" data-course="${course?.name||'—'}">
        <div class="slot-hour">${hour}</div>
        <div class="slot-info">
          <div class="slot-course">${course?.name||'Corso non trovato'}</div>
          <div class="slot-instructor">${instructor?.name||'Nessun istruttore'}</div>
        </div>
        <div class="slot-bar-wrap">
          <div class="slot-bar-bg">
            <div class="slot-bar-fill${isFull?' full':''}" style="width:${pct}%"></div>
          </div>
          <div class="slot-count">${bks}/${cap}</div>
        </div>
        <span class="badge ${isFull?'badge-slot-full':'badge-slot-free'}" style="font-size:.64rem;">
          ${isFull?'Completo':'Libero'}
        </span>
      </div>`;
  }).join('');

  container.querySelectorAll('.slot-row').forEach(row => {
    row.addEventListener('click', () => {
      openPanel(row.dataset.slotid, row.dataset.hour, row.dataset.course, bookings, userMap);
    });
  });
}

// ── Pannello laterale ────────────────────────────────────────
function openPanel(slotId, hour, courseName, bookings, userMap) {
  const bks  = bookings.filter(b => b.slotId === slotId);
  document.getElementById('panelTitle').textContent = `${courseName} — ${hour}`;
  const body = document.getElementById('panelBody');

  if (bks.length === 0) {
    body.innerHTML = `
      <div class="panel-slot-detail">
        <p>Corso</p><strong>${courseName}</strong>
        <p style="margin-top:8px;">Ora</p><strong>${hour}</strong>
      </div>
      <div class="empty-state"><p>Nessun corsista prenotato.</p></div>`;
  } else {
    body.innerHTML = `
      <div class="panel-slot-detail">
        <p>Corso</p><strong>${courseName}</strong>
        <p style="margin-top:8px;">Prenotati</p><strong>${bks.length} corsisti</strong>
      </div>` +
      bks.map(b => {
        const u = userMap[b.userId];
        if (!u) return '';
        return `<div class="corsista-item">
          <div class="corsista-avatar">${(u.name?.[0]||'?').toUpperCase()}</div>
          <div>
            <div class="corsista-name">${u.name||''} ${u.surname||''}</div>
            <div class="corsista-email">${u.email||''}</div>
          </div>
        </div>`;
      }).join('');
  }
  document.getElementById('sidePanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
}

function closePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
}

// ── Report corsi ─────────────────────────────────────────────
function renderReportCorsi(courses, slotsP, bookingsC, paymentsP) {
  const tbody = document.getElementById('reportCorsi');
  if (!courses.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px;">Nessun corso.</td></tr>`;
    return;
  }
  tbody.innerHTML = courses.map(c => {
    const cs   = slotsP.filter(s => s.courseId === c.id);
    const cb   = bookingsC.filter(b => cs.find(s => s.id === b.slotId)).length;
    const cap  = cs.reduce((a,s) => a+(s.maxCapacity||5), 0);
    const pct  = cap > 0 ? Math.round((cb/cap)*100) : 0;
    const inc  = paymentsP.filter(p => cs.find(s => s.id === p.slotId)).reduce((a,p)=>a+(p.amount||0),0);
    return `<tr><td><strong>${c.name}</strong></td><td>${cs.length}</td><td>${cb}</td><td>${pct}%</td><td>€${inc.toFixed(0)}</td></tr>`;
  }).join('');
}

// ── Report sale ──────────────────────────────────────────────
function renderReportSale(rooms, slotsP, bookingsC, paymentsP) {
  const tbody = document.getElementById('reportSale');
  if (!rooms.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:16px;">Nessuna sala.</td></tr>`;
    return;
  }
  tbody.innerHTML = rooms.map(r => {
    const rs  = slotsP.filter(s => s.roomId === r.id);
    const cap = rs.reduce((a,s) => a+(s.maxCapacity||r.capacity||5), 0);
    const bks = bookingsC.filter(b => rs.find(s => s.id === b.slotId)).length;
    const pct = cap > 0 ? Math.round((bks/cap)*100) : 0;
    const inc = paymentsP.filter(p => rs.find(s => s.id === p.slotId)).reduce((a,p)=>a+(p.amount||0),0);
    return `<tr><td><strong>${r.name}</strong></td><td>${rs.length}</td><td>${pct}%</td><td>€${inc.toFixed(0)}</td></tr>`;
  }).join('');
}

// ── Feed attività ─────────────────────────────────────────────
function renderFeed(bookings, users, slots, payments, courseMap) {
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const slotMap = Object.fromEntries(slots.map(s => [s.id, s]));
  const events  = [];

  bookings.forEach(b => {
    const u = userMap[b.userId];
    const s = slotMap[b.slotId];
    const c = courseMap[s?.courseId];
    if (!u || !s) return;
    const hour = `${String(s.hour).padStart(2,'0')}:00`;
    if (b.status === 'confirmed' && b.createdAt)
      events.push({ text:`${u.name||''} ${u.surname||''} ha prenotato ${c?.name||'lezione'} ${hour}`, time:b.createdAt, type:'book' });
    if (b.status === 'cancelled' && b.cancelledAt)
      events.push({ text:`${u.name||''} ${u.surname||''} ha disdetto ${c?.name||'lezione'} ${hour}`, time:b.cancelledAt, type:'cancel' });
  });

  users.filter(u => u.role==='corsista' && u.createdAt).forEach(u =>
    events.push({ text:`Nuovo socio: ${u.name||''} ${u.surname||''}`, time:u.createdAt, type:'new' })
  );

  payments.forEach(p => {
    const u = userMap[p.userId];
    if (!u || !p.date) return;
    events.push({ text:`Pagamento: ${u.name||''} ${u.surname||''} €${p.amount||0}`, time:p.date, type:'pay' });
  });

  events.sort((a,b) => {
    const ta = a.time?.toDate ? a.time.toDate() : new Date(a.time||0);
    const tb = b.time?.toDate ? b.time.toDate() : new Date(b.time||0);
    return tb - ta;
  });

  const feed = document.getElementById('feedList');
  if (!events.length) {
    feed.innerHTML = `<div class="empty-state"><p>Nessuna attività recente.</p></div>`;
    return;
  }
  feed.innerHTML = events.slice(0,10).map(ev => `
    <div class="feed-item">
      <div class="feed-dot ${ev.type==='cancel'?'cancel':ev.type==='new'?'new':ev.type==='pay'?'pay':''}"></div>
      <div>
        <div class="feed-text">${ev.text}</div>
        <div class="feed-time">${timeAgo(ev.time)}</div>
      </div>
    </div>`).join('');
}

// ── Alert ────────────────────────────────────────────────────
function renderAlerts(corsisti, slots) {
  const today     = new Date();
  const in7       = new Date(today.getTime() + 7*86400000);
  const tomorrow  = toYMD(new Date(today.getTime() + 86400000));
  const alerts    = [];

  corsisti.filter(u => u.paymentType==='subscription' && u.subscriptionExpiry).forEach(u => {
    const exp = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : new Date(u.subscriptionExpiry);
    if (exp >= today && exp <= in7)
      alerts.push({ type:'warning', text:`Abbonamento in scadenza`, sub:`${u.name||''} ${u.surname||''} — scade il ${exp.toLocaleDateString('it-IT')}` });
  });

  const senzaIstr = slots.filter(s => s.date === tomorrow && (!s.instructorId || s.instructorId === ''));
  if (senzaIstr.length)
    alerts.push({ type:'info', text:`${senzaIstr.length} lezione/i di domani senza istruttore`, sub:'Vai al calendario per assegnare un istruttore' });

  const alertList = document.getElementById('alertList');
  if (!alerts.length) {
    alertList.innerHTML = `<div class="alert-item alert-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      <div><div class="alert-text">Tutto in ordine!</div><div class="alert-sub">Nessun avviso da segnalare.</div></div>
    </div>`;
    return;
  }
  alertList.innerHTML = alerts.map(a => `
    <div class="alert-item alert-${a.type}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${a.type==='warning'
          ?'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
          :'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <div><div class="alert-text">${a.text}</div><div class="alert-sub">${a.sub}</div></div>
    </div>`).join('');
}
