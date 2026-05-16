// ============================================================
// js/anagrafica.js — Gestione Anagrafica Soci
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCIYt0tgl0MQbG3KAkpqTg_ZZMykT0w8lw",
  authDomain:        "gestionale-palestra-44dba.firebaseapp.com",
  projectId:         "gestionale-palestra-44dba",
  storageBucket:     "gestionale-palestra-44dba.firebasestorage.app",
  messagingSenderId: "127344006319",
  appId:             "1:127344006319:web:a478ba76a586e8c1b7705a"
};

// App principale (admin)
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// App secondaria per creare utenti senza fare logout dell'admin
const appAux  = initializeApp(firebaseConfig, 'aux');
const authAux = getAuth(appAux);

// ── Stato globale ─────────────────────────────────────────────
let allSoci      = [];
let currentSocio = null; // socio aperto nel pannello dettaglio

// ── Auth check ────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'admin') {
    window.location.href = 'index.html'; return;
  }
  document.body.classList.remove('hidden');
  initSidebar(snap.data());
  initPage();
});

// ── Sidebar ───────────────────────────────────────────────────
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
  const nav = pages.map(p => `
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
    <nav class="sidebar-nav">${nav}</nav>
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
    await signOut(auth); window.location.href = 'index.html';
  });
}

// ── Helpers ───────────────────────────────────────────────────
function avatarColor(name) {
  const colors = ['#0f507b','#e6165c','#1a8a45','#c9821a','#6b3fa0','#0e7490','#b91c1c'];
  const idx = (name||'').charCodeAt(0) % colors.length;
  return colors[idx];
}

function initials(name, surname) {
  return `${(name||'?')[0]}${(surname||'')[0]||''}`.toUpperCase();
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function toast(msg, type = 'success') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type]||''}<span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Init page ─────────────────────────────────────────────────
function initPage() {
  loadSoci();
  setupModal();
  setupDetailPanel();
  setupFilters();
  setupPagamento();

  // Chiudi modal con pulsanti [data-close]
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  // Chiudi modal cliccando fuori
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd.id); });
  });
}

// ── Carica soci ───────────────────────────────────────────────
async function loadSoci() {
  const snap = await getDocs(collection(db, 'users'));
  allSoci = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.role === 'corsista');
  renderTabella(allSoci);
}

// ── Render tabella ────────────────────────────────────────────
function renderTabella(soci) {
  const tbody = document.getElementById('tabellaCorsi');
  document.getElementById('countLabel').textContent =
    `${soci.length} socio/i trovato/i`;

  if (!soci.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Nessun socio trovato.</td></tr>`;
    return;
  }

  tbody.innerHTML = soci.map(s => {
    const color  = avatarColor(s.name);
    const ini    = initials(s.name, s.surname);
    const isAbb  = s.paymentType === 'subscription';
    const stato  = s.status === 'sospeso' ? 'sospeso' : 'attivo';
    const phone  = s.phone || '';
    const waLink = phone ? `https://wa.me/${phone.replace(/\D/g,'')}` : '#';

    // Saldo / scadenza
    let saldoHTML = '—';
    if (isAbb && s.subscriptionExpiry) {
      const exp    = s.subscriptionExpiry.toDate ? s.subscriptionExpiry.toDate() : new Date(s.subscriptionExpiry);
      const today  = new Date();
      const days   = Math.ceil((exp - today) / 86400000);
      const cls    = days < 0 ? 'saldo-danger' : days <= 7 ? 'saldo-warn' : 'saldo-ok';
      const label  = days < 0 ? 'Scaduto' : days === 0 ? 'Scade oggi' : `${days} gg`;
      saldoHTML = `<span class="${cls}">${label}</span><br><small style="color:var(--text-muted)">${formatDate(s.subscriptionExpiry)}</small>`;
    } else if (!isAbb) {
      const cred = s.creditBalance || 0;
      const cls  = cred <= 0 ? 'saldo-danger' : cred <= 2 ? 'saldo-warn' : 'saldo-ok';
      saldoHTML  = `<span class="${cls}">${cred} lezioni</span>`;
    }

    return `
      <tr>
        <td>
          <div class="nome-cell">
            <div class="avatar" style="background:${color};">${ini}</div>
            <div class="nome-info">
              <span class="nome-label" data-id="${s.id}">${s.name||''} ${s.surname||''}</span>
              <span class="nome-sub">${s.notes||''}</span>
            </div>
          </div>
        </td>
        <td>
          <a href="mailto:${s.email}" class="contact-link">${s.email||'—'}</a><br>
          ${phone ? `<a href="${waLink}" target="_blank" class="contact-link">${phone}</a>` : '<span style="color:var(--text-muted)">—</span>'}
        </td>
        <td>
          <span class="badge ${isAbb?'badge-info':'badge-slot-free'}">
            ${isAbb?'Abbonamento':'A lezione'}
          </span>
        </td>
        <td>${saldoHTML}</td>
        <td>
          <span class="badge ${stato==='attivo'?'badge-active':'badge-inactive'}">
            ${stato==='attivo'?'Attivo':'Sospeso'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-icon btn-modifica" data-id="${s.id}" title="Modifica">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon btn-pagamento" data-id="${s.id}" title="Pagamento">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon btn-messaggio" data-id="${s.id}" title="Messaggio" onclick="window.location.href='messaggi.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Click sul nome → apri dettaglio
  tbody.querySelectorAll('.nome-label').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
  });
  // Modifica
  tbody.querySelectorAll('.btn-modifica').forEach(el => {
    el.addEventListener('click', () => openModalModifica(el.dataset.id));
  });
  // Pagamento
  tbody.querySelectorAll('.btn-pagamento').forEach(el => {
    el.addEventListener('click', () => openModalPagamento(el.dataset.id));
  });
}

// ── Filtri ────────────────────────────────────────────────────
function setupFilters() {
  const applyFilters = () => {
    const q    = document.getElementById('searchInput').value.toLowerCase();
    const stat = document.getElementById('filterStato').value;
    const pag  = document.getElementById('filterPagamento').value;
    const res  = allSoci.filter(s => {
      const name  = `${s.name||''} ${s.surname||''} ${s.email||''}`.toLowerCase();
      const stato = s.status === 'sospeso' ? 'sospeso' : 'attivo';
      if (q && !name.includes(q)) return false;
      if (stat && stato !== stat) return false;
      if (pag  && s.paymentType !== pag) return false;
      return true;
    });
    renderTabella(res);
  };
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('filterStato').addEventListener('change', applyFilters);
  document.getElementById('filterPagamento').addEventListener('change', applyFilters);
}

// ── Modal Nuovo/Modifica Socio ────────────────────────────────
let editingId = null;

function setupModal() {
  document.getElementById('btnNuovoSocio').addEventListener('click', () => {
    editingId = null;
    resetModalSocio();
    document.getElementById('modalSocioTitle').textContent = 'Nuovo Socio';
    document.getElementById('btnSalvaText').textContent = 'Crea account';
    document.getElementById('sectionCredenziali').style.display = 'block';
    openModal('modalSocio');
  });

  // Radio pagamento
  document.querySelectorAll('#radioTipoPagamento .radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#radioTipoPagamento .radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const val = opt.querySelector('input').value;
      document.getElementById('fieldLesson').classList.toggle('visible', val === 'lesson');
      document.getElementById('fieldSubscription').classList.toggle('visible', val === 'subscription');
    });
  });

  // Toggle password visibile
  document.getElementById('togglePw').addEventListener('click', () => {
    const pw = document.getElementById('socioPassword');
    pw.type = pw.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnSalvaSocio').addEventListener('click', salvaSocio);
}

function resetModalSocio() {
  document.getElementById('socioNome').value          = '';
  document.getElementById('socioCognome').value       = '';
  document.getElementById('socioEmail').value         = '';
  document.getElementById('socioTelefono').value      = '+39 ';
  document.getElementById('socioNote').value          = '';
  document.getElementById('socioCreditoIniziale').value = '0';
  document.getElementById('socioImportoAbb').value    = '';
  document.getElementById('socioInizioAbb').value     = '';
  document.getElementById('socioScadenzaAbb').value   = '';
  document.getElementById('socioPassword').value      = '';
  document.getElementById('modalSocioError').style.display = 'none';
  // Reset radio
  document.querySelectorAll('#radioTipoPagamento .radio-option').forEach((o,i) => o.classList.toggle('selected', i===0));
  document.querySelector('#radioTipoPagamento input[value="lesson"]').checked = true;
  document.getElementById('fieldLesson').classList.add('visible');
  document.getElementById('fieldSubscription').classList.remove('visible');
}

function openModalModifica(id) {
  const s = allSoci.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('modalSocioTitle').textContent = 'Modifica Socio';
  document.getElementById('btnSalvaText').textContent    = 'Salva modifiche';
  document.getElementById('sectionCredenziali').style.display = 'none';
  resetModalSocio();
  document.getElementById('socioNome').value     = s.name || '';
  document.getElementById('socioCognome').value  = s.surname || '';
  document.getElementById('socioEmail').value    = s.email || '';
  document.getElementById('socioTelefono').value = s.phone || '+39 ';
  document.getElementById('socioNote').value     = s.notes || '';

  const isAbb = s.paymentType === 'subscription';
  document.querySelectorAll('#radioTipoPagamento .radio-option').forEach(o => {
    const match = o.querySelector('input').value === (isAbb ? 'subscription' : 'lesson');
    o.classList.toggle('selected', match);
  });
  document.querySelector(`#radioTipoPagamento input[value="${isAbb?'subscription':'lesson'}"]`).checked = true;
  document.getElementById('fieldLesson').classList.toggle('visible', !isAbb);
  document.getElementById('fieldSubscription').classList.toggle('visible', isAbb);

  if (!isAbb) {
    document.getElementById('socioCreditoIniziale').value = s.creditBalance || 0;
  } else {
    document.getElementById('socioImportoAbb').value  = s.subscriptionAmount || '';
    if (s.subscriptionStart) document.getElementById('socioInizioAbb').value = toDateInput(s.subscriptionStart);
    if (s.subscriptionExpiry) document.getElementById('socioScadenzaAbb').value = toDateInput(s.subscriptionExpiry);
  }
  openModal('modalSocio');
}

function toDateInput(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

async function salvaSocio() {
  const nome     = document.getElementById('socioNome').value.trim();
  const cognome  = document.getElementById('socioCognome').value.trim();
  const email    = document.getElementById('socioEmail').value.trim();
  const telefono = document.getElementById('socioTelefono').value.trim();
  const note     = document.getElementById('socioNote').value.trim();
  const tipoPag  = document.querySelector('#radioTipoPagamento input:checked')?.value || 'lesson';
  const errEl    = document.getElementById('modalSocioError');

  errEl.style.display = 'none';

  if (!nome || !cognome || !email) {
    errEl.textContent = 'Nome, cognome ed email sono obbligatori.';
    errEl.style.display = 'block'; return;
  }

  const dati = {
    name: nome, surname: cognome, email, phone: telefono,
    notes: note, role: 'corsista', paymentType: tipoPag,
    status: 'attivo'
  };

  if (tipoPag === 'lesson') {
    dati.creditBalance = parseInt(document.getElementById('socioCreditoIniziale').value) || 0;
  } else {
    dati.subscriptionAmount = parseFloat(document.getElementById('socioImportoAbb').value) || 0;
    const inizio  = document.getElementById('socioInizioAbb').value;
    const scaden  = document.getElementById('socioScadenzaAbb').value;
    if (inizio)  dati.subscriptionStart  = Timestamp.fromDate(new Date(inizio));
    if (scaden)  dati.subscriptionExpiry = Timestamp.fromDate(new Date(scaden));
  }

  // Spinner
  document.getElementById('btnSalvaText').classList.add('hidden');
  document.getElementById('btnSalvaSpinner').classList.remove('hidden');
  document.getElementById('btnSalvaSocio').disabled = true;

  try {
    if (editingId) {
      // Modifica
      await updateDoc(doc(db, 'users', editingId), dati);
      toast('Socio aggiornato con successo!');
    } else {
      // Nuovo socio — crea account Firebase Auth con app ausiliaria
      const password = document.getElementById('socioPassword').value;
      if (!password || password.length < 6) {
        errEl.textContent = 'La password deve avere almeno 6 caratteri.';
        errEl.style.display = 'block';
        return;
      }
      const cred = await createUserWithEmailAndPassword(authAux, email, password);
      dati.createdAt = serverTimestamp();
      await setDoc(doc(db, 'users', cred.user.uid), dati);
      // Disconnetti l'app ausiliaria (non l'admin)
      await authAux.signOut();
      toast('Account corsista creato con successo!');
    }
    closeModal('modalSocio');
    loadSoci();
  } catch (err) {
    const msgs = {
      'auth/email-already-in-use': 'Questa email è già registrata.',
      'auth/invalid-email':        'Email non valida.',
      'auth/weak-password':        'Password troppo debole (min 6 caratteri).'
    };
    errEl.textContent = msgs[err.code] || `Errore: ${err.message}`;
    errEl.style.display = 'block';
  } finally {
    document.getElementById('btnSalvaText').classList.remove('hidden');
    document.getElementById('btnSalvaSpinner').classList.add('hidden');
    document.getElementById('btnSalvaSocio').disabled = false;
  }
}

// ── Modal Pagamento ───────────────────────────────────────────
let pagamentoSocioId = null;

function setupPagamento() {
  document.getElementById('pagTipo').addEventListener('change', () => {
    const tipo = document.getElementById('pagTipo').value;
    const isCredit = tipo === 'credit';
    document.getElementById('pagImportoWrap').style.display = isCredit ? 'none' : 'block';
    document.getElementById('pagLezioniWrap').style.display = isCredit ? 'block' : 'none';
    if (tipo === 'lesson') document.getElementById('pagImporto').value = 20;
    if (tipo === 'subscription') document.getElementById('pagImporto').value = '';
  });

  document.getElementById('btnRegistraPagamento').addEventListener('click', registraPagamento);
}

function openModalPagamento(id) {
  const s = allSoci.find(x => x.id === id);
  if (!s) return;
  pagamentoSocioId = id;
  document.getElementById('pagSocioNome').value = `${s.name||''} ${s.surname||''}`;
  document.getElementById('pagTipo').value      = 'lesson';
  document.getElementById('pagImporto').value   = 20;
  document.getElementById('pagLezioniWrap').style.display = 'none';
  document.getElementById('pagImportoWrap').style.display = 'block';
  document.getElementById('pagData').value      = new Date().toISOString().split('T')[0];
  document.getElementById('pagNote').value      = '';
  openModal('modalPagamento');
}

async function registraPagamento() {
  const tipo    = document.getElementById('pagTipo').value;
  const isCredit = tipo === 'credit';
  const importo = parseFloat(document.getElementById('pagImporto').value) || 0;
  const lezioni = parseInt(document.getElementById('pagLezioni').value) || 0;
  const dataVal = document.getElementById('pagData').value;
  const note    = document.getElementById('pagNote').value.trim();

  if (!dataVal) { toast('Seleziona una data.', 'error'); return; }
  if (!isCredit && importo <= 0) { toast('Inserisci un importo valido.', 'error'); return; }
  if (isCredit && lezioni <= 0)  { toast('Inserisci il numero di lezioni.', 'error'); return; }

  const pagDoc = {
    userId: pagamentoSocioId,
    type:   tipo,
    amount: isCredit ? 0 : importo,
    date:   Timestamp.fromDate(new Date(dataVal)),
    notes:  note,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'payments'), pagDoc);

    // Aggiorna saldo/credito nel documento utente
    const socio = allSoci.find(x => x.id === pagamentoSocioId);
    if (tipo === 'credit') {
      await updateDoc(doc(db, 'users', pagamentoSocioId), {
        creditBalance: (socio.creditBalance || 0) + lezioni
      });
    } else if (tipo === 'lesson') {
      // Pagamento singola lezione: non modifica il credito prepagato
    } else if (tipo === 'subscription') {
      // Eventuale aggiornamento scadenza abbonamento
    }

    toast('Pagamento registrato!');
    closeModal('modalPagamento');
    loadSoci();
    if (currentSocio?.id === pagamentoSocioId) openDetail(pagamentoSocioId);
  } catch (err) {
    toast('Errore nella registrazione.', 'error');
  }
}

// ── Pannello dettaglio ────────────────────────────────────────
function setupDetailPanel() {
  document.getElementById('btnCloseDetail').addEventListener('click', closeDetail);
  document.getElementById('overlayDetail').addEventListener('click', closeDetail);

  // Tab switching
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  document.getElementById('btnDetailModifica').addEventListener('click', () => {
    if (currentSocio) { closeDetail(); openModalModifica(currentSocio.id); }
  });

  document.getElementById('btnDetailSospendi').addEventListener('click', async () => {
    if (!currentSocio) return;
    const nuovoStato = currentSocio.status === 'sospeso' ? 'attivo' : 'sospeso';
    await updateDoc(doc(db, 'users', currentSocio.id), { status: nuovoStato });
    toast(nuovoStato === 'sospeso' ? 'Socio sospeso.' : 'Socio riattivato.', 'info');
    loadSoci();
    openDetail(currentSocio.id);
  });

  document.getElementById('btnDetailElimina').addEventListener('click', async () => {
    if (!currentSocio) return;
    const nome = `${currentSocio.name||''} ${currentSocio.surname||''}`;
    if (!confirm(`Sei sicuro di voler eliminare ${nome}?\nQuesta azione non può essere annullata.`)) return;
    await deleteDoc(doc(db, 'users', currentSocio.id));
    toast('Socio eliminato.', 'info');
    closeDetail();
    loadSoci();
  });
}

async function openDetail(id) {
  const s = allSoci.find(x => x.id === id);
  if (!s) return;
  currentSocio = s;

  const color = avatarColor(s.name);
  const ini   = initials(s.name, s.surname);
  const isAbb = s.paymentType === 'subscription';
  const stato = s.status === 'sospeso' ? 'sospeso' : 'attivo';

  document.getElementById('detailAvatar').style.background = color;
  document.getElementById('detailAvatar').textContent      = ini;
  document.getElementById('detailName').textContent = `${s.name||''} ${s.surname||''}`;
  document.getElementById('detailSub').textContent  = s.email || '';

  document.getElementById('d-nome').textContent    = s.name || '—';
  document.getElementById('d-cognome').textContent = s.surname || '—';
  document.getElementById('d-email').innerHTML     = `<a href="mailto:${s.email}" class="contact-link">${s.email||'—'}</a>`;
  document.getElementById('d-telefono').innerHTML  = s.phone
    ? `<a href="https://wa.me/${(s.phone||'').replace(/\D/g,'')}" target="_blank" class="contact-link">${s.phone}</a>`
    : '—';
  document.getElementById('d-tipo').textContent    = isAbb ? 'Abbonamento' : 'A lezione';
  document.getElementById('d-note').textContent    = s.notes || '—';
  document.getElementById('d-data').textContent    = formatDate(s.createdAt);

  document.getElementById('d-saldo-wrap').style.display    = isAbb ? 'none' : 'block';
  document.getElementById('d-scadenza-wrap').style.display = isAbb ? 'block' : 'none';
  document.getElementById('d-saldo').textContent    = `${s.creditBalance || 0} lezioni`;
  document.getElementById('d-scadenza').textContent = formatDate(s.subscriptionExpiry);

  // Pulsante sospendi/riattiva
  document.getElementById('btnDetailSospendi').textContent =
    stato === 'sospeso' ? 'Riattiva' : 'Sospendi';

  // WA / Email
  document.getElementById('btnDetailWA').onclick = () => {
    if (s.phone) window.open(`https://wa.me/${s.phone.replace(/\D/g,'')}`, '_blank');
    else toast('Nessun numero di telefono.', 'error');
  };
  document.getElementById('btnDetailEmail').onclick = () => {
    if (s.email) window.location.href = `mailto:${s.email}`;
    else toast('Nessuna email.', 'error');
  };

  // Apri pannello
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('overlayDetail').classList.add('open');

  // Carica prenotazioni e pagamenti
  loadDetailPrenotazioni(id);
  loadDetailPagamenti(id);
}

async function loadDetailPrenotazioni(userId) {
  const container = document.getElementById('listaPrenotazioni');
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Caricamento…</div>';

  const booksSnap = await getDocs(query(collection(db, 'bookings'), where('userId','==',userId)));
  const books = booksSnap.docs.map(d => ({ id:d.id, ...d.data() }));

  if (!books.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Nessuna prenotazione.</div>';
    return;
  }

  // Carica slot
  const slotIds = [...new Set(books.map(b => b.slotId))];
  const slotsMap = {};
  await Promise.all(slotIds.map(async sid => {
    const snap = await getDoc(doc(db, 'slots', sid));
    if (snap.exists()) slotsMap[sid] = snap.data();
  }));

  // Carica corsi
  const coursesSnap = await getDocs(collection(db, 'courses'));
  const courseMap   = Object.fromEntries(coursesSnap.docs.map(d => [d.id, d.data()]));

  const sorted = books.sort((a,b) => {
    const sa = slotsMap[a.slotId]; const sb = slotsMap[b.slotId];
    return (sb?.date||'') > (sa?.date||'') ? 1 : -1;
  }).slice(0,20);

  container.innerHTML = sorted.map(b => {
    const slot   = slotsMap[b.slotId];
    const course = courseMap[slot?.courseId];
    const hour   = slot ? `${String(slot.hour).padStart(2,'0')}:00` : '—';
    const isCancelled = b.status === 'cancelled';
    return `
      <div class="history-item">
        <div class="history-dot${isCancelled?' style="background:var(--magenta)"':''}"></div>
        <div>
          <div class="history-text" style="${isCancelled?'text-decoration:line-through;color:var(--text-muted)':''}">
            ${course?.name||'Lezione'} — ${hour} — ${slot?.date||'—'}
          </div>
          <div class="history-date">${isCancelled?'Disdetta':'Confermata'}</div>
        </div>
      </div>`;
  }).join('');
}

async function loadDetailPagamenti(userId) {
  const container = document.getElementById('listaPagamenti');
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Caricamento…</div>';

  const snap = await getDocs(query(collection(db, 'payments'), where('userId','==',userId)));
  const pags = snap.docs.map(d => ({ id:d.id, ...d.data() }))
    .sort((a,b) => {
      const da = a.date?.toDate?a.date.toDate():new Date(a.date||0);
      const db_ = b.date?.toDate?b.date.toDate():new Date(b.date||0);
      return db_ - da;
    });

  if (!pags.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Nessun pagamento registrato.</div>';
    return;
  }

  const tipoLabel = { lesson:'Singola lezione', subscription:'Abbonamento', credit:'Ricarica credito' };
  container.innerHTML = pags.map(p => `
    <div class="history-item">
      <div class="history-dot pay"></div>
      <div>
        <div class="history-text">${tipoLabel[p.type]||p.type} — ${p.amount>0?'€'+p.amount:'—'}${p.notes?` (${p.notes})`:''}</div>
        <div class="history-date">${formatDate(p.date)}</div>
      </div>
    </div>`).join('');
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('overlayDetail').classList.remove('open');
  currentSocio = null;
}
