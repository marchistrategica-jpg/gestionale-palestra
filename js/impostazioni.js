// ============================================================
// js/impostazioni.js
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

var allRooms       = [];
var allCourses     = [];
var allInstructors = [];
var allUsers       = [];
var allTemplates   = [];
var editingId      = { sala:null, corso:null, istr:null, tpl:null };

var GIORNI_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
var GIORNI_IT   = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

// ── Auth ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  var snap = await getDoc(doc(db,'users',user.uid));
  if (!snap.exists()||snap.data().role!=='admin') {
    window.location.href = 'index.html'; return;
  }
  document.body.classList.remove('hidden');
  initSidebar(snap.data());
  await loadAllData();
  initUI();
});

// ── Sidebar ───────────────────────────────────────────────────
function initSidebar(userData) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  var pages = [
    {href:'dashboard.html',label:'Dashboard',icon:'grid'},
    {href:'anagrafica.html',label:'Anagrafica',icon:'users'},
    {href:'calendario-admin.html',label:'Calendario',icon:'calendar'},
    {href:'messaggi.html',label:'Messaggi',icon:'message'},
    {href:'impostazioni.html',label:'Impostazioni',icon:'settings'}
  ];
  var icons = {
    grid:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    users:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  };
  var cur = window.location.pathname.split('/').pop();
  var nav = pages.map(function(p) {
    return '<a href="' + p.href + '" class="nav-item' + (cur===p.href?' active':'') + '">'
      + '<span class="nav-icon">' + icons[p.icon] + '</span>'
      + '<span class="nav-label">' + p.label + '</span></a>';
  }).join('');
  var name = ((userData.name||'')+ ' '+(userData.surname||'')).trim();
  sidebar.innerHTML = ''
    + '<div class="sidebar-header"><img src="pittogramma%20Strategica.png" alt="Logo" class="sidebar-logo"/>'
    + '<span class="sidebar-title">Gestionale<br>Palestra</span></div>'
    + '<nav class="sidebar-nav">' + nav + '</nav>'
    + '<div class="sidebar-footer"><div class="sidebar-user">'
    + '<div class="sidebar-user-avatar">' + ((userData.name||'A')[0]).toUpperCase() + '</div>'
    + '<div class="sidebar-user-info">'
    + '<span class="sidebar-user-name">' + (name||'Admin') + '</span>'
    + '<span class="sidebar-user-role">Admin</span></div></div>'
    + '<button class="btn-logout" id="btnLogout" title="Esci">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">'
    + '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>'
    + '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
    + '</svg></button></div>';
  document.getElementById('btnLogout').addEventListener('click', function() {
    signOut(auth).then(function(){window.location.href='index.html';});
  });
}

// ── Helpers ───────────────────────────────────────────────────
function showToast(msg, type) {
  type = type||'success';
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + msg + '</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(function(){el.remove();}, 3500);
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Carica tutti i dati ───────────────────────────────────────
async function loadAllData() {
  var results = await Promise.all([
    getDocs(collection(db,'rooms')),
    getDocs(collection(db,'courses')),
    getDocs(collection(db,'instructors')),
    getDocs(collection(db,'users')),
    getDocs(collection(db,'templates'))
  ]);
  allRooms       = results[0].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allCourses     = results[1].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allInstructors = results[2].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allUsers       = results[3].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allTemplates   = results[4].docs.map(function(d){return Object.assign({id:d.id},d.data());});
}

// ── Init UI ───────────────────────────────────────────────────
function initUI() {
  // Menu laterale
  document.querySelectorAll('.settings-menu-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.settings-menu-btn').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.settings-section').forEach(function(s){s.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById('sec-' + btn.dataset.sec).classList.add('active');
    });
  });

  // Chiudi modal
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function(){closeModal(btn.dataset.close);});
  });
  document.querySelectorAll('.modal-backdrop').forEach(function(bd) {
    bd.addEventListener('click', function(e){if(e.target===bd)closeModal(bd.id);});
  });

  // Popola ore
  var selStart = document.getElementById('startHour');
  var selEnd   = document.getElementById('endHour');
  for (var h=0; h<=23; h++) {
    var label = String(h).padStart(2,'0') + ':00';
    var o1 = document.createElement('option'); o1.value=h; o1.textContent=label; selStart.appendChild(o1);
    var o2 = document.createElement('option'); o2.value=h; o2.textContent=label; selEnd.appendChild(o2);
  }

  // Giorni chip
  document.querySelectorAll('.giorno-chip').forEach(function(chip) {
    chip.addEventListener('click', function(){ chip.classList.toggle('on'); });
  });

  initGenerali();
  initSale();
  initCorsi();
  initIstruttori();
  initAccessi();
  initTemplate();
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 1 — GENERALI
// ══════════════════════════════════════════════════════════════
async function initGenerali() {
  try {
    var snap = await getDoc(doc(db,'settings','main'));
    if (snap.exists()) {
      var d = snap.data();
      document.getElementById('gymName').value    = d.gymName||'';
      document.getElementById('lessonPrice').value= d.lessonPrice||20;
      document.getElementById('startHour').value  = d.startHour||6;
      document.getElementById('endHour').value    = d.endHour||21;
      var openDays = d.openDays||[1,2,3,4,5,6];
      document.querySelectorAll('.giorno-chip').forEach(function(chip) {
        if (openDays.indexOf(parseInt(chip.dataset.day))!==-1) chip.classList.add('on');
      });
    }
  } catch(e) {}

  document.getElementById('btnSalvaGenerali').addEventListener('click', async function() {
    var openDays = [];
    document.querySelectorAll('.giorno-chip.on').forEach(function(chip){
      openDays.push(parseInt(chip.dataset.day));
    });
    try {
      await setDoc(doc(db,'settings','main'), {
        gymName:     document.getElementById('gymName').value.trim()||'Gestionale Palestra',
        lessonPrice: parseFloat(document.getElementById('lessonPrice').value)||20,
        startHour:   parseInt(document.getElementById('startHour').value)||6,
        endHour:     parseInt(document.getElementById('endHour').value)||21,
        openDays:    openDays
      });
      showToast('Impostazioni salvate!');
    } catch(e) { showToast('Errore nel salvataggio.','error'); }
  });
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 2 — SALE
// ══════════════════════════════════════════════════════════════
function initSale() {
  renderSale();
  document.getElementById('btnNuovaSala').addEventListener('click', function() {
    editingId.sala = null;
    document.getElementById('modalSalaTitle').textContent = 'Nuova Sala';
    document.getElementById('salaNome').value     = '';
    document.getElementById('salaCapienza').value = '';
    document.getElementById('salaColore').value   = '#0f507b';
    document.querySelector('input[name="salaStato"][value="true"]').checked = true;
    openModal('modalSala');
  });
  document.getElementById('btnSalvaSala').addEventListener('click', salvaSala);
}

function renderSale() {
  var container = document.getElementById('listaSale');
  if (!allRooms.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:10px 0;">Nessuna sala. Aggiungine una!</div>';
    return;
  }
  var html = '';
  allRooms.forEach(function(r) {
    var isActive = r.isActive !== false;
    html += '<div class="item-card">'
      + '<div class="color-dot" style="background:' + (r.color||'#0f507b') + '"></div>'
      + '<div class="item-card-info">'
      + '<div class="item-card-name">' + (r.name||'—') + '</div>'
      + '<div class="item-card-sub">Capienza: ' + (r.capacity||'—') + ' posti</div>'
      + '</div>'
      + '<div class="toggle-wrap">'
      + '<div class="toggle ' + (isActive?'on':'') + '" data-roomid="' + r.id + '" title="' + (isActive?'Attiva':'In manutenzione') + '"></div>'
      + '<span>' + (isActive?'Attiva':'Manutenzione') + '</span>'
      + '</div>'
      + '<div class="item-card-actions">'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-editsala="' + r.id + '">Modifica</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-delsala="' + r.id + '">Elimina</button>'
      + '</div></div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('.toggle').forEach(function(tog) {
    tog.addEventListener('click', async function() {
      var isOn = tog.classList.contains('on');
      tog.classList.toggle('on');
      tog.nextElementSibling.textContent = !isOn ? 'Attiva' : 'Manutenzione';
      await updateDoc(doc(db,'rooms',tog.dataset.roomid), {isActive: !isOn});
      var r = allRooms.find(function(x){return x.id===tog.dataset.roomid;});
      if (r) r.isActive = !isOn;
      showToast(!isOn ? 'Sala attivata.' : 'Sala in manutenzione.', 'info');
    });
  });

  container.querySelectorAll('[data-editsala]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var r = allRooms.find(function(x){return x.id===btn.dataset.editsala;});
      if (!r) return;
      editingId.sala = r.id;
      document.getElementById('modalSalaTitle').textContent = 'Modifica Sala';
      document.getElementById('salaNome').value     = r.name||'';
      document.getElementById('salaCapienza').value = r.capacity||'';
      document.getElementById('salaColore').value   = r.color||'#0f507b';
      document.querySelector('input[name="salaStato"][value="' + (r.isActive!==false?'true':'false') + '"]').checked = true;
      openModal('modalSala');
    });
  });

  container.querySelectorAll('[data-delsala]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questa sala?')) return;
      await deleteDoc(doc(db,'rooms',btn.dataset.delsala));
      allRooms = allRooms.filter(function(r){return r.id!==btn.dataset.delsala;});
      renderSale();
      showToast('Sala eliminata.','info');
    });
  });
}

async function salvaSala() {
  var nome     = document.getElementById('salaNome').value.trim();
  var capienza = parseInt(document.getElementById('salaCapienza').value)||0;
  var colore   = document.getElementById('salaColore').value;
  var isActive = document.querySelector('input[name="salaStato"]:checked').value === 'true';
  if (!nome||!capienza) { showToast('Nome e capienza obbligatori.','error'); return; }
  var dati = {name:nome, capacity:capienza, color:colore, isActive:isActive};
  try {
    if (editingId.sala) {
      await updateDoc(doc(db,'rooms',editingId.sala), dati);
      var idx = allRooms.findIndex(function(r){return r.id===editingId.sala;});
      if (idx!==-1) allRooms[idx] = Object.assign({id:editingId.sala},dati);
      showToast('Sala aggiornata!');
    } else {
      dati.createdAt = serverTimestamp();
      var ref = await addDoc(collection(db,'rooms'), dati);
      allRooms.push(Object.assign({id:ref.id},dati));
      showToast('Sala creata!');
    }
    closeModal('modalSala');
    renderSale();
  } catch(e) { showToast('Errore: '+e.message,'error'); }
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 3 — CORSI
// ══════════════════════════════════════════════════════════════
function initCorsi() {
  renderCorsi();
  document.getElementById('btnNuovoCorso').addEventListener('click', function() {
    editingId.corso = null;
    document.getElementById('modalCorsoTitle').textContent = 'Nuovo Corso';
    document.getElementById('corsoNome').value   = '';
    document.getElementById('corsoColore').value = '#e6165c';
    renderCorsoSaleList([]);
    openModal('modalCorso');
  });
  document.getElementById('btnSalvaCorso').addEventListener('click', salvaCorso);
}

function renderCorsoSaleList(selected) {
  var container = document.getElementById('corsoSaleList');
  if (!allRooms.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.78rem;">Nessuna sala disponibile.</div>';
    return;
  }
  container.innerHTML = allRooms.map(function(r) {
    var checked = selected.indexOf(r.id)!==-1 ? 'checked' : '';
    return '<label class="check-item">'
      + '<input type="checkbox" data-salaid="' + r.id + '" ' + checked + ' />'
      + r.name + '</label>';
  }).join('');
}

function renderCorsi() {
  var container = document.getElementById('listaCorsi');
  if (!allCourses.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:10px 0;">Nessun corso. Aggiungine uno!</div>';
    return;
  }
  var html = '';
  allCourses.forEach(function(c) {
    var saleCompatibili = (c.compatibleRooms||[]).map(function(rid) {
      var r = allRooms.find(function(x){return x.id===rid;});
      return r ? '<span class="badge badge-info" style="font-size:.68rem;">' + r.name + '</span>' : '';
    }).join('');
    html += '<div class="item-card">'
      + '<div class="color-dot" style="background:' + (c.color||'#e6165c') + '"></div>'
      + '<div class="item-card-info">'
      + '<div class="item-card-name">' + (c.name||'—') + '</div>'
      + '<div class="badge-list" style="margin-top:4px;">' + (saleCompatibili||'<span style="font-size:.75rem;color:var(--text-muted);">Tutte le sale</span>') + '</div>'
      + '</div>'
      + '<div class="item-card-actions">'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-editcorso="' + c.id + '">Modifica</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-delcorso="' + c.id + '">Elimina</button>'
      + '</div></div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('[data-editcorso]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var c = allCourses.find(function(x){return x.id===btn.dataset.editcorso;});
      if (!c) return;
      editingId.corso = c.id;
      document.getElementById('modalCorsoTitle').textContent = 'Modifica Corso';
      document.getElementById('corsoNome').value   = c.name||'';
      document.getElementById('corsoColore').value = c.color||'#e6165c';
      renderCorsoSaleList(c.compatibleRooms||[]);
      openModal('modalCorso');
    });
  });

  container.querySelectorAll('[data-delcorso]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questo corso?')) return;
      await deleteDoc(doc(db,'courses',btn.dataset.delcorso));
      allCourses = allCourses.filter(function(c){return c.id!==btn.dataset.delcorso;});
      renderCorsi();
      showToast('Corso eliminato.','info');
    });
  });
}

async function salvaCorso() {
  var nome   = document.getElementById('corsoNome').value.trim();
  var colore = document.getElementById('corsoColore').value;
  if (!nome) { showToast('Nome obbligatorio.','error'); return; }
  var saleSelezionate = [];
  document.querySelectorAll('#corsoSaleList input[type="checkbox"]:checked').forEach(function(cb) {
    saleSelezionate.push(cb.dataset.salaid);
  });
  var dati = {name:nome, color:colore, compatibleRooms:saleSelezionate};
  try {
    if (editingId.corso) {
      await updateDoc(doc(db,'courses',editingId.corso), dati);
      var idx = allCourses.findIndex(function(c){return c.id===editingId.corso;});
      if (idx!==-1) allCourses[idx] = Object.assign({id:editingId.corso},dati);
      showToast('Corso aggiornato!');
    } else {
      dati.createdAt = serverTimestamp();
      var ref = await addDoc(collection(db,'courses'), dati);
      allCourses.push(Object.assign({id:ref.id},dati));
      showToast('Corso creato!');
    }
    closeModal('modalCorso');
    renderCorsi();
  } catch(e) { showToast('Errore: '+e.message,'error'); }
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 4 — ISTRUTTORI
// ══════════════════════════════════════════════════════════════
function initIstruttori() {
  renderIstruttori();
  document.getElementById('btnNuovoIstruttore').addEventListener('click', function() {
    editingId.istr = null;
    document.getElementById('modalIstrTitle').textContent = 'Nuovo Istruttore';
    document.getElementById('istrNome').value     = '';
    document.getElementById('istrCognome').value  = '';
    document.getElementById('istrEmail').value    = '';
    document.getElementById('istrTelefono').value = '';
    renderIstrCorsiList([]);
    renderAvailability({});
    openModal('modalIstruttore');
  });
  document.getElementById('btnSalvaIstruttore').addEventListener('click', salvaIstruttore);
}

function renderIstrCorsiList(selected) {
  var container = document.getElementById('istrCorsiList');
  if (!allCourses.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.78rem;">Nessun corso disponibile.</div>';
    return;
  }
  container.innerHTML = allCourses.map(function(c) {
    var checked = selected.indexOf(c.id)!==-1 ? 'checked' : '';
    return '<label class="check-item">'
      + '<input type="checkbox" data-corsoid="' + c.id + '" ' + checked + ' />'
      + c.name + '</label>';
  }).join('');
}

function renderAvailability(avail) {
  var container = document.getElementById('availabilityRows');
  container.innerHTML = GIORNI_KEYS.map(function(key, i) {
    var dayAvail = (avail[key]||[])[0] || null;
    var checked  = dayAvail ? 'checked' : '';
    var from     = dayAvail ? dayAvail.from : '08:00';
    var to       = dayAvail ? dayAvail.to   : '13:00';
    return '<div class="avail-row">'
      + '<label class="check-item" style="width:100px;">'
      + '<input type="checkbox" class="avail-check" data-day="' + key + '" ' + checked + ' />'
      + '<span class="avail-label">' + GIORNI_IT[i] + '</span></label>'
      + '<div class="avail-time">'
      + '<span>dalle</span>'
      + '<input type="time" class="avail-from" data-day="' + key + '" value="' + from + '" />'
      + '<span>alle</span>'
      + '<input type="time" class="avail-to" data-day="' + key + '" value="' + to + '" />'
      + '</div></div>';
  }).join('');
}

function renderIstruttori() {
  var container = document.getElementById('listaIstruttori');
  if (!allInstructors.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:10px 0;">Nessun istruttore. Aggiungine uno!</div>';
    return;
  }
  var html = '';
  allInstructors.forEach(function(i) {
    var corsiLabels = (i.teachableCourses||[]).map(function(cid) {
      var c = allCourses.find(function(x){return x.id===cid;});
      return c ? '<span class="badge badge-info" style="font-size:.68rem;">' + c.name + '</span>' : '';
    }).join('');
    var availSummary = GIORNI_KEYS.map(function(key, idx) {
      var d = (i.availability||{})[key];
      if (!d||!d.length) return '';
      return GIORNI_IT[idx].substring(0,3) + ' ' + d[0].from + '-' + d[0].to;
    }).filter(Boolean).join(', ');

    html += '<div class="item-card" style="align-items:flex-start;">'
      + '<div class="item-card-info">'
      + '<div class="item-card-name">' + (i.name||'') + '</div>'
      + '<div class="item-card-sub">'
      + (i.email?'<a href="mailto:' + i.email + '" style="color:var(--blu);font-weight:600;">' + i.email + '</a>':'' )
      + (i.phone?' · <a href="https://wa.me/' + (i.phone||'').replace(/\D/g,'') + '" target="_blank" style="color:var(--blu);font-weight:600;">' + i.phone + '</a>':'')
      + '</div>'
      + '<div class="badge-list" style="margin-top:4px;">' + (corsiLabels||'—') + '</div>'
      + (availSummary?'<div class="item-card-sub" style="margin-top:4px;">' + availSummary + '</div>':'')
      + '</div>'
      + '<div class="item-card-actions">'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-editistr="' + i.id + '">Modifica</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-delistr="' + i.id + '">Elimina</button>'
      + '</div></div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('[data-editistr]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = allInstructors.find(function(x){return x.id===btn.dataset.editistr;});
      if (!i) return;
      editingId.istr = i.id;
      document.getElementById('modalIstrTitle').textContent = 'Modifica Istruttore';
      document.getElementById('istrNome').value     = i.name||'';
      document.getElementById('istrCognome').value  = i.surname||'';
      document.getElementById('istrEmail').value    = i.email||'';
      document.getElementById('istrTelefono').value = i.phone||'';
      renderIstrCorsiList(i.teachableCourses||[]);
      renderAvailability(i.availability||{});
      openModal('modalIstruttore');
    });
  });

  container.querySelectorAll('[data-delistr]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questo istruttore?')) return;
      await deleteDoc(doc(db,'instructors',btn.dataset.delistr));
      allInstructors = allInstructors.filter(function(i){return i.id!==btn.dataset.delistr;});
      renderIstruttori();
      showToast('Istruttore eliminato.','info');
    });
  });
}

async function salvaIstruttore() {
  var nome    = document.getElementById('istrNome').value.trim();
  var cognome = document.getElementById('istrCognome').value.trim();
  if (!nome||!cognome) { showToast('Nome e cognome obbligatori.','error'); return; }

  var corsiSelezionati = [];
  document.querySelectorAll('#istrCorsiList input[type="checkbox"]:checked').forEach(function(cb) {
    corsiSelezionati.push(cb.dataset.corsoid);
  });

  var availability = {};
  document.querySelectorAll('.avail-check:checked').forEach(function(cb) {
    var key  = cb.dataset.day;
    var from = document.querySelector('.avail-from[data-day="' + key + '"]').value;
    var to   = document.querySelector('.avail-to[data-day="' + key + '"]').value;
    availability[key] = [{from:from, to:to}];
  });

  var dati = {
    name:             nome,
    surname:          cognome,
    email:            document.getElementById('istrEmail').value.trim(),
    phone:            document.getElementById('istrTelefono').value.trim(),
    teachableCourses: corsiSelezionati,
    availability:     availability
  };

  try {
    if (editingId.istr) {
      await updateDoc(doc(db,'instructors',editingId.istr), dati);
      var idx = allInstructors.findIndex(function(i){return i.id===editingId.istr;});
      if (idx!==-1) allInstructors[idx] = Object.assign({id:editingId.istr},dati);
      showToast('Istruttore aggiornato!');
    } else {
      dati.createdAt = serverTimestamp();
      var ref = await addDoc(collection(db,'instructors'), dati);
      allInstructors.push(Object.assign({id:ref.id},dati));
      showToast('Istruttore creato!');
    }
    closeModal('modalIstruttore');
    renderIstruttori();
  } catch(e) { showToast('Errore: '+e.message,'error'); }
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 5 — ACCESSI CORSISTI
// ══════════════════════════════════════════════════════════════
function initAccessi() {
  renderAccessi();
}

function renderAccessi() {
  var container = document.getElementById('listaAccessi');
  var corsisti  = allUsers.filter(function(u){return u.role==='corsista';});
  if (!corsisti.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:10px 0;">Nessun corsista registrato.</div>';
    return;
  }
  var html = '';
  corsisti.forEach(function(u) {
    var stato = u.status==='sospeso' ? 'sospeso' : 'attivo';
    html += '<div class="accessi-row">'
      + '<div class="accessi-info">'
      + '<div class="accessi-name">' + (u.name||'') + ' ' + (u.surname||'') + '</div>'
      + '<div class="accessi-email">' + (u.email||'—') + '</div>'
      + '</div>'
      + '<span class="badge ' + (stato==='attivo'?'badge-active':'badge-inactive') + '">' + (stato==='attivo'?'Attivo':'Sospeso') + '</span>'
      + '<div class="accessi-actions">'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;white-space:nowrap;" data-resetpw="' + u.id + '" data-email="' + (u.email||'') + '">Reset password</button>'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-sospendi="' + u.id + '" data-stato="' + stato + '">' + (stato==='sospeso'?'Riattiva':'Sospendi') + '</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-delaccesso="' + u.id + '">Elimina</button>'
      + '</div></div>';
  });
  container.innerHTML = html;

  // Reset password
  container.querySelectorAll('[data-resetpw]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var email = btn.dataset.email;
      if (!email) { showToast('Nessuna email per questo utente.','error'); return; }
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Email di reset inviata a ' + email + '!','success');
      } catch(e) { showToast('Errore: '+e.message,'error'); }
    });
  });

  // Sospendi / Riattiva
  container.querySelectorAll('[data-sospendi]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var nuovoStato = btn.dataset.stato==='sospeso' ? 'attivo' : 'sospeso';
      await updateDoc(doc(db,'users',btn.dataset.sospendi), {status:nuovoStato});
      var u = allUsers.find(function(x){return x.id===btn.dataset.sospendi;});
      if (u) u.status = nuovoStato;
      renderAccessi();
      showToast(nuovoStato==='sospeso'?'Utente sospeso.':'Utente riattivato.','info');
    });
  });

  // Elimina (solo Firestore — Auth va eliminato manualmente da Firebase Console)
  container.querySelectorAll('[data-delaccesso]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questo corsista?\n\nI dati verranno rimossi dal gestionale.\nRicorda di eliminare anche l\'account da Firebase Console → Authentication.')) return;
      await deleteDoc(doc(db,'users',btn.dataset.delaccesso));
      allUsers = allUsers.filter(function(u){return u.id!==btn.dataset.delaccesso;});
      renderAccessi();
      showToast('Corsista eliminato dal gestionale.','info');
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SEZIONE 6 — TEMPLATE
// ══════════════════════════════════════════════════════════════
function initTemplate() {
  renderTemplate();

  document.getElementById('btnNuovoTpl').addEventListener('click', function() {
    editingId.tpl = null;
    document.getElementById('modalTplTitle').textContent = 'Nuovo Template';
    document.getElementById('tplNome').value    = '';
    document.getElementById('tplBody').value    = '';
    document.getElementById('tplSoggetto').value= '';
    document.querySelector('input[name="tplTipo"][value="whatsapp"]').checked = true;
    document.getElementById('tplSoggettoWrap').style.display = 'none';
    openModal('modalTemplate');
  });

  document.querySelectorAll('input[name="tplTipo"]').forEach(function(r) {
    r.addEventListener('change', function() {
      document.getElementById('tplSoggettoWrap').style.display = r.value==='email'?'block':'none';
    });
  });

  document.querySelectorAll('#tplChips .var-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var ta = document.getElementById('tplBody');
      var v  = chip.dataset.var;
      var s  = ta.selectionStart; var e = ta.selectionEnd;
      ta.value = ta.value.substring(0,s)+v+ta.value.substring(e);
      ta.selectionStart = ta.selectionEnd = s+v.length;
      ta.focus();
    });
  });

  document.getElementById('btnSalvaTpl').addEventListener('click', salvaTpl);
}

function renderTemplate() {
  var container = document.getElementById('listaTemplate');
  if (!allTemplates.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:10px 0;">Nessun template. Creane uno!</div>';
    return;
  }
  var html = '';
  allTemplates.forEach(function(t) {
    var isEmail  = t.type==='email';
    var preview  = (t.body||'').substring(0,100)+((t.body||'').length>100?'…':'');
    html += '<div class="template-card">'
      + '<div class="template-card-header">'
      + '<span class="badge ' + (isEmail?'badge-info':'badge-active') + '">' + (isEmail?'Email':'WhatsApp') + '</span>'
      + '<div class="template-name">' + (t.name||'Template') + '</div>'
      + '</div>'
      + (t.subject?'<div style="font-size:.75rem;color:var(--text-muted);font-weight:600;">Oggetto: '+t.subject+'</div>':'')
      + '<div class="template-preview">' + preview + '</div>'
      + '<div class="template-actions">'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-edittpl="' + t.id + '">Modifica</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-deltpl="' + t.id + '">Elimina</button>'
      + '</div></div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('[data-edittpl]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var t = allTemplates.find(function(x){return x.id===btn.dataset.edittpl;});
      if (!t) return;
      editingId.tpl = t.id;
      document.getElementById('modalTplTitle').textContent = 'Modifica Template';
      document.getElementById('tplNome').value    = t.name||'';
      document.getElementById('tplBody').value    = t.body||'';
      document.getElementById('tplSoggetto').value= t.subject||'';
      var isEmail = t.type==='email';
      document.querySelector('input[name="tplTipo"][value="'+(isEmail?'email':'whatsapp')+'"]').checked=true;
      document.getElementById('tplSoggettoWrap').style.display=isEmail?'block':'none';
      openModal('modalTemplate');
    });
  });

  container.querySelectorAll('[data-deltpl]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questo template?')) return;
      await deleteDoc(doc(db,'templates',btn.dataset.deltpl));
      allTemplates = allTemplates.filter(function(t){return t.id!==btn.dataset.deltpl;});
      renderTemplate();
      showToast('Template eliminato.','info');
    });
  });
}

async function salvaTpl() {
  var nome = document.getElementById('tplNome').value.trim();
  var body = document.getElementById('tplBody').value.trim();
  var tipo = document.querySelector('input[name="tplTipo"]:checked').value;
  var sogg = document.getElementById('tplSoggetto').value.trim();
  if (!nome||!body) { showToast('Nome e testo obbligatori.','error'); return; }
  var dati = {name:nome, type:tipo, body:body};
  if (tipo==='email'&&sogg) dati.subject=sogg;
  try {
    if (editingId.tpl) {
      await updateDoc(doc(db,'templates',editingId.tpl), dati);
      var idx = allTemplates.findIndex(function(t){return t.id===editingId.tpl;});
      if (idx!==-1) allTemplates[idx] = Object.assign({id:editingId.tpl},dati);
      showToast('Template aggiornato!');
    } else {
      dati.createdAt = serverTimestamp();
      var ref = await addDoc(collection(db,'templates'), dati);
      allTemplates.push(Object.assign({id:ref.id},dati));
      showToast('Template creato!');
    }
    closeModal('modalTemplate');
    renderTemplate();
  } catch(e) { showToast('Errore: '+e.message,'error'); }
}
