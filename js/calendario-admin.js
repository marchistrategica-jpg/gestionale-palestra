// ============================================================
// js/calendario-admin.js
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc, query, where,
  serverTimestamp
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

// ── Stato globale ─────────────────────────────────────────────
var currentWeekStart = getMonday(new Date());
var allSlots         = [];
var allBookings      = [];
var allRooms         = [];
var allCourses       = [];
var allInstructors   = [];
var allUsers         = [];
var editingSlotId    = null;
var panelSlotId      = null;

var DAYS   = ['Lun','Mar','Mer','Gio','Ven','Sab'];
var HOURS  = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

// ── Auth ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  var snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'admin') {
    window.location.href = 'index.html'; return;
  }
  document.body.classList.remove('hidden');
  initSidebar(snap.data());
  await loadData();
  initUI();
  renderCalendar();
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
  var name = ((userData.name||'') + ' ' + (userData.surname||'')).trim();
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
    signOut(auth).then(function() { window.location.href = 'index.html'; });
  });
}

// ── Helpers ───────────────────────────────────────────────────
function getMonday(d) {
  var dt = new Date(d);
  var day = dt.getDay() || 7;
  dt.setDate(dt.getDate() - day + 1);
  dt.setHours(0,0,0,0);
  return dt;
}

function toYMD(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, n) {
  var dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

function formatDateIt(d) {
  return d.toLocaleDateString('it-IT', {day:'2-digit',month:'2-digit',year:'numeric'});
}

function showToast(msg, type) {
  type = type || 'success';
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + msg + '</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(function() { el.remove(); }, 3500);
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Carica dati ───────────────────────────────────────────────
async function loadData() {
  var results = await Promise.all([
    getDocs(collection(db,'slots')),
    getDocs(collection(db,'bookings')),
    getDocs(collection(db,'rooms')),
    getDocs(collection(db,'courses')),
    getDocs(collection(db,'instructors')),
    getDocs(collection(db,'users'))
  ]);
  allSlots       = results[0].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allBookings    = results[1].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allRooms       = results[2].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allCourses     = results[3].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allInstructors = results[4].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allUsers       = results[5].docs.map(function(d){return Object.assign({id:d.id},d.data());});
}

// ── Init UI ───────────────────────────────────────────────────
function initUI() {
  // Popola filtri
  var selSala = document.getElementById('filterSala');
  allRooms.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.id; opt.textContent = r.name;
    selSala.appendChild(opt);
  });
  var selCorso = document.getElementById('filterCorso');
  allCourses.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    selCorso.appendChild(opt);
  });
  var selIstr = document.getElementById('filterIstruttore');
  allInstructors.forEach(function(i) {
    var opt = document.createElement('option');
    opt.value = i.id; opt.textContent = i.name;
    selIstr.appendChild(opt);
  });

  // Filtri → ridisegna
  ['filterSala','filterCorso','filterIstruttore'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', renderCalendar);
  });

  // Navigazione settimana
  document.getElementById('btnPrevWeek').addEventListener('click', function() {
    currentWeekStart = addDays(currentWeekStart, -7);
    renderCalendar();
  });
  document.getElementById('btnNextWeek').addEventListener('click', function() {
    currentWeekStart = addDays(currentWeekStart, 7);
    renderCalendar();
  });
  document.getElementById('btnToday').addEventListener('click', function() {
    currentWeekStart = getMonday(new Date());
    renderCalendar();
  });

  // Pulsante nuova lezione
  document.getElementById('btnNuovaLezione').addEventListener('click', function() {
    openModalLezione(null, null, null);
  });

  // Popola ore nel modal
  var selOra = document.getElementById('lezOra');
  HOURS.forEach(function(h) {
    var opt = document.createElement('option');
    opt.value = h;
    opt.textContent = String(h).padStart(2,'0') + ':00';
    selOra.appendChild(opt);
  });

  // Popola sale nel modal
  var selSalaM = document.getElementById('lezSala');
  allRooms.filter(function(r){return r.isActive!==false;}).forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.id; opt.textContent = r.name + ' (max ' + r.capacity + ')';
    selSalaM.appendChild(opt);
  });

  // Al cambio sala → aggiorna corsi; al cambio corso → aggiorna istruttori
  document.getElementById('lezSala').addEventListener('change', onSalaChange);
  document.getElementById('lezCorso').addEventListener('change', onCorsoChange);
  onSalaChange();

  // Radio ripeti
  document.querySelectorAll('#radioRipeti .radio-opt').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('#radioRipeti .radio-opt').forEach(function(o){o.classList.remove('selected');});
      opt.classList.add('selected');
    });
  });

  // Salva lezione
  document.getElementById('btnSalvaLezione').addEventListener('click', salvaLezione);

  // Elimina lezione
  document.getElementById('btnEliminaLezione').addEventListener('click', function() {
    var slot = allSlots.find(function(s){return s.id===editingSlotId;});
    if (slot && slot.recurringGroupId) {
      closeModal('modalLezione');
      openModal('modalElimina');
    } else {
      if (confirm('Eliminare questa lezione?')) eliminaSlot(editingSlotId, false);
    }
  });

  document.getElementById('btnEliminaSolo').addEventListener('click', function() {
    closeModal('modalElimina');
    eliminaSlot(editingSlotId, false);
  });
  document.getElementById('btnEliminaTutti').addEventListener('click', function() {
    closeModal('modalElimina');
    eliminaSlot(editingSlotId, true);
  });

  // Chiudi modal con [data-close]
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function() { closeModal(btn.dataset.close); });
  });
  document.querySelectorAll('.modal-backdrop').forEach(function(bd) {
    bd.addEventListener('click', function(e) {
      if (e.target===bd) closeModal(bd.id);
    });
  });

  // Pannello laterale
  document.getElementById('btnClosePanel').addEventListener('click', closePanel);
  document.getElementById('panelOverlay').addEventListener('click', closePanel);
  document.getElementById('btnPanelModifica').addEventListener('click', function() {
    if (panelSlotId) { closePanel(); openModalLezione(null, null, panelSlotId); }
  });
  document.getElementById('btnPanelChiudi').addEventListener('click', chiudiSalaPanel);
  document.getElementById('btnPanelMessaggio').addEventListener('click', messaggioPrenotati);

  // Legenda
  renderLegenda();
}

function onSalaChange() {
  var salaId = document.getElementById('lezSala').value;
  var sala   = allRooms.find(function(r){return r.id===salaId;});
  var selCorso = document.getElementById('lezCorso');
  selCorso.innerHTML = '<option value="">Seleziona corso…</option>';
  if (sala) {
    var compatible = allCourses.filter(function(c) {
      return !c.compatibleRooms || c.compatibleRooms.length===0 || c.compatibleRooms.indexOf(salaId)!==-1;
    });
    compatible.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name;
      selCorso.appendChild(opt);
    });
    if (sala.capacity) document.getElementById('lezCapienza').value = sala.capacity;
  }
  onCorsoChange();
}

function onCorsoChange() {
  var corsoId = document.getElementById('lezCorso').value;
  var selIstr = document.getElementById('lezIstruttore');
  selIstr.innerHTML = '<option value="">Seleziona istruttore…</option>';
  var istrFiltrati = corsoId
    ? allInstructors.filter(function(i) {
        return !i.teachableCourses || i.teachableCourses.length===0 || i.teachableCourses.indexOf(corsoId)!==-1;
      })
    : allInstructors;
  istrFiltrati.forEach(function(i) {
    var opt = document.createElement('option');
    opt.value = i.id; opt.textContent = i.name;
    selIstr.appendChild(opt);
  });
}

// ── Legenda ───────────────────────────────────────────────────
function renderLegenda() {
  var leg = document.getElementById('legenda');
  var html = '';
  allRooms.forEach(function(r) {
    html += '<div class="legenda-item">'
      + '<div class="legenda-dot" style="background:' + (r.color||'#0f507b') + '"></div>'
      + r.name + '</div>';
  });
  html += '<div class="legenda-item"><div class="legenda-dot" style="background:#e6165c"></div>Completo</div>';
  html += '<div class="legenda-item"><div class="legenda-dot" style="background:#f5d89a;border:1px solid #c9821a"></div>Chiuso</div>';
  leg.innerHTML = html;
}

// ── Render calendario ─────────────────────────────────────────
function renderCalendar() {
  var today      = toYMD(new Date());
  var filterSala = document.getElementById('filterSala').value;
  var filterCorso= document.getElementById('filterCorso').value;
  var filterIstr = document.getElementById('filterIstruttore').value;

  // Aggiorna titolo periodo
  var endWeek = addDays(currentWeekStart, 5);
  document.getElementById('calPeriod').textContent =
    formatDateIt(currentWeekStart) + ' — ' + formatDateIt(endWeek);

  // Mappa slot per data+ora+sala
  var slotMap = {};
  allSlots.forEach(function(s) {
    var key = s.date + '_' + s.hour + '_' + (s.roomId||'');
    slotMap[key] = s;
  });

  // Mappa prenotazioni per slotId
  var bookMap = {};
  allBookings.forEach(function(b) {
    if (!bookMap[b.slotId]) bookMap[b.slotId] = [];
    bookMap[b.slotId].push(b);
  });

  var grid = document.getElementById('calGrid');
  var html = '';

  // Header
  html += '<div class="cal-head-empty"></div>';
  for (var di=0; di<6; di++) {
    var dayDate = addDays(currentWeekStart, di);
    var ymd     = toYMD(dayDate);
    var isToday = ymd === today;
    html += '<div class="cal-head-day' + (isToday?' today':'') + '">'
      + DAYS[di] + '<span class="day-num">' + dayDate.getDate() + '</span></div>';
  }

  // Righe orarie
  for (var hi=0; hi<HOURS.length; hi++) {
    var hour = HOURS[hi];
    html += '<div class="cal-time">' + String(hour).padStart(2,'0') + ':00</div>';

    for (var di2=0; di2<6; di2++) {
      var dayDate2 = addDays(currentWeekStart, di2);
      var ymd2     = toYMD(dayDate2);
      var isToday2 = ymd2 === today;

      html += '<div class="cal-cell' + (isToday2?' today-col':'') + '" data-date="' + ymd2 + '" data-hour="' + hour + '">';
      html += '<div class="cal-cell-inner">';

      // Cerca slot per questa cella (per ogni sala attiva, se non filtrato)
      var rooms = filterSala ? allRooms.filter(function(r){return r.id===filterSala;}) : allRooms;

      var hasSlot = false;
      rooms.forEach(function(room) {
        var key  = ymd2 + '_' + hour + '_' + room.id;
        var slot = slotMap[key];
        if (!slot) return;

        // Applica filtri corso/istruttore
        if (filterCorso && slot.courseId !== filterCorso) return;
        if (filterIstr  && slot.instructorId !== filterIstr) return;

        hasSlot = true;
        var course  = allCourses.find(function(c){return c.id===slot.courseId;});
        var istr    = allInstructors.find(function(i){return i.id===slot.instructorId;});
        var bks     = (bookMap[slot.id]||[]).filter(function(b){return b.status==='confirmed';}).length;
        var cap     = slot.maxCapacity || room.capacity || 5;
        var pct     = Math.round((bks/cap)*100);
        var isFull  = bks >= cap;
        var isClosed= slot.isActive === false;
        var color   = course ? course.color : (room.color||'#0f507b');
        var istrIni = istr ? (istr.name||'').split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase() : '—';
        var courseN = course ? (course.name.length>10 ? course.name.substring(0,9)+'…' : course.name) : '?';

        if (isClosed) {
          html += '<div class="slot-card closed" data-slotid="' + slot.id + '">'
            + '<div class="slot-card-course">Chiuso</div></div>';
        } else {
          html += '<div class="slot-card ' + (isFull?'full':'free') + '" data-slotid="' + slot.id + '" style="background:' + color + ';">'
            + '<div class="slot-card-course">' + courseN + '</div>'
            + '<div class="slot-card-info">' + istrIni + ' · ' + bks + '/' + cap + '</div>'
            + '<div class="slot-card-bar"><div class="slot-card-bar-fill" style="width:' + pct + '%"></div></div>'
            + '</div>';
        }
      });

      // Cella vuota cliccabile
      if (!hasSlot) {
        html += '<div class="slot-empty" data-date="' + ymd2 + '" data-hour="' + hour + '">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
          + 'Aggiungi</div>';
      }

      html += '</div></div>';
    }
  }

  grid.innerHTML = html;

  // Event listeners sulle slot card
  grid.querySelectorAll('.slot-card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      e.stopPropagation();
      openPanel(card.dataset.slotid);
    });
  });

  // Event listeners celle vuote
  grid.querySelectorAll('.slot-empty').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      openModalLezione(el.dataset.date, parseInt(el.dataset.hour), null);
    });
  });

  // Click su cella (non su slot)
  grid.querySelectorAll('.cal-cell').forEach(function(cell) {
    cell.addEventListener('click', function() {
      openModalLezione(cell.dataset.date, parseInt(cell.dataset.hour), null);
    });
  });
}

// ── Modal lezione ─────────────────────────────────────────────
function openModalLezione(date, hour, slotId) {
  editingSlotId = slotId;
  document.getElementById('modalLezError').style.display = 'none';
  document.getElementById('btnEliminaLezione').style.display = slotId ? 'block' : 'none';
  document.getElementById('modalLezioneTitle').textContent = slotId ? 'Modifica Lezione' : 'Nuova Lezione';
  document.getElementById('btnSalvaLezText').textContent = slotId ? 'Salva modifiche' : 'Salva lezione';

  if (slotId) {
    var slot = allSlots.find(function(s){return s.id===slotId;});
    if (slot) {
      document.getElementById('lezData').value = slot.date || '';
      document.getElementById('lezOra').value  = slot.hour || 6;
      document.getElementById('lezSala').value = slot.roomId || '';
      onSalaChange();
      document.getElementById('lezCorso').value = slot.courseId || '';
      onCorsoChange();
      document.getElementById('lezIstruttore').value = slot.instructorId || '';
      document.getElementById('lezCapienza').value   = slot.maxCapacity || 5;
    }
  } else {
    document.getElementById('lezData').value = date || toYMD(new Date());
    document.getElementById('lezOra').value  = hour || 8;
    if (allRooms.length) document.getElementById('lezSala').value = allRooms[0].id;
    onSalaChange();
  }

  // Reset radio ripeti
  document.querySelectorAll('#radioRipeti .radio-opt').forEach(function(o,i){o.classList.toggle('selected',i===0);});
  document.querySelector('#radioRipeti input[value="once"]').checked = true;

  openModal('modalLezione');
}

async function salvaLezione() {
  var data      = document.getElementById('lezData').value;
  var ora       = parseInt(document.getElementById('lezOra').value);
  var salaId    = document.getElementById('lezSala').value;
  var corsoId   = document.getElementById('lezCorso').value;
  var istrId    = document.getElementById('lezIstruttore').value;
  var capienza  = parseInt(document.getElementById('lezCapienza').value) || 5;
  var ripeti    = document.querySelector('#radioRipeti input:checked').value;
  var errEl     = document.getElementById('modalLezError');
  errEl.style.display = 'none';

  if (!data || !salaId || !corsoId || !istrId) {
    errEl.textContent = 'Compila tutti i campi obbligatori.';
    errEl.style.display = 'block'; return;
  }

  document.getElementById('btnSalvaLezText').classList.add('hidden');
  document.getElementById('btnSalvaLezSpinner').classList.remove('hidden');
  document.getElementById('btnSalvaLezione').disabled = true;

  try {
    var dates = getDatesForRepeat(data, ripeti);
    var groupId = dates.length > 1 ? ('grp_' + Date.now()) : null;

    if (editingSlotId) {
      // Modifica slot esistente
      await updateDoc(doc(db,'slots',editingSlotId), {
        date:data, hour:ora, roomId:salaId, courseId:corsoId,
        instructorId:istrId, maxCapacity:capienza, isActive:true
      });
      showToast('Lezione aggiornata!');
    } else {
      // Crea nuovi slot
      for (var i=0; i<dates.length; i++) {
        var slotData = {
          date:dates[i], hour:ora, roomId:salaId, courseId:corsoId,
          instructorId:istrId, maxCapacity:capienza, isActive:true,
          createdAt:serverTimestamp()
        };
        if (groupId) slotData.recurringGroupId = groupId;
        await addDoc(collection(db,'slots'), slotData);
      }
      showToast(dates.length > 1 ? 'Lezioni create (' + dates.length + ')!' : 'Lezione creata!');
    }

    closeModal('modalLezione');
    await loadData();
    renderCalendar();
  } catch(err) {
    errEl.textContent = 'Errore: ' + err.message;
    errEl.style.display = 'block';
  } finally {
    document.getElementById('btnSalvaLezText').classList.remove('hidden');
    document.getElementById('btnSalvaLezSpinner').classList.add('hidden');
    document.getElementById('btnSalvaLezione').disabled = false;
  }
}

function getDatesForRepeat(startDate, ripeti) {
  var dates = [];
  var start = new Date(startDate);
  if (ripeti === 'once') {
    dates.push(toYMD(start)); return dates;
  }
  if (ripeti === 'week') {
    var mon = getMonday(start);
    for (var i=0; i<6; i++) {
      var d = addDays(mon, i);
      dates.push(toYMD(d));
    }
    return dates;
  }
  if (ripeti === 'month') {
    var d2 = new Date(start.getFullYear(), start.getMonth(), 1);
    var endM = new Date(start.getFullYear(), start.getMonth()+1, 1);
    while (d2 < endM) {
      var dow = d2.getDay();
      if (dow >= 1 && dow <= 6) dates.push(toYMD(d2));
      d2 = addDays(d2, 1);
    }
    return dates;
  }
  return [toYMD(start)];
}

async function eliminaSlot(slotId, tutti) {
  try {
    if (tutti) {
      var slot = allSlots.find(function(s){return s.id===slotId;});
      if (slot && slot.recurringGroupId) {
        var gruppoSlots = allSlots.filter(function(s){return s.recurringGroupId===slot.recurringGroupId;});
        for (var i=0; i<gruppoSlots.length; i++) {
          await deleteDoc(doc(db,'slots',gruppoSlots[i].id));
        }
        showToast('Serie di lezioni eliminata.', 'info');
      }
    } else {
      await deleteDoc(doc(db,'slots',slotId));
      showToast('Lezione eliminata.', 'info');
    }
    closeModal('modalLezione');
    closeModal('modalElimina');
    await loadData();
    renderCalendar();
  } catch(err) {
    showToast('Errore eliminazione.', 'error');
  }
}

// ── Pannello dettaglio ────────────────────────────────────────
async function openPanel(slotId) {
  panelSlotId = slotId;
  var slot    = allSlots.find(function(s){return s.id===slotId;});
  if (!slot) return;

  var course = allCourses.find(function(c){return c.id===slot.courseId;});
  var room   = allRooms.find(function(r){return r.id===slot.roomId;});
  var istr   = allInstructors.find(function(i){return i.id===slot.instructorId;});
  var bks    = allBookings.filter(function(b){return b.slotId===slotId;});
  var confirmed = bks.filter(function(b){return b.status==='confirmed';}).length;

  document.getElementById('panelTitle').textContent = (course&&course.name)||'Lezione';
  document.getElementById('panelSub').textContent   = slot.date + ' alle ' + String(slot.hour).padStart(2,'0') + ':00';

  document.getElementById('panelInfo').innerHTML = ''
    + '<div class="slot-detail-row"><span class="slot-detail-label">Sala</span><span class="slot-detail-val">' + ((room&&room.name)||'—') + '</span></div>'
    + '<div class="slot-detail-row"><span class="slot-detail-label">Istruttore</span><span class="slot-detail-val">' + ((istr&&istr.name)||'—') + '</span></div>'
    + '<div class="slot-detail-row"><span class="slot-detail-label">Prenotati</span><span class="slot-detail-val">' + confirmed + '/' + (slot.maxCapacity||5) + '</span></div>'
    + '<div class="slot-detail-row"><span class="slot-detail-label">Stato</span><span class="slot-detail-val">' + (slot.isActive===false?'Chiuso':'Aperto') + '</span></div>';

  document.getElementById('panelPrenotatiTitle').textContent = 'Prenotati (' + confirmed + ')';

  // Lista prenotati
  var userMap = {};
  allUsers.forEach(function(u){userMap[u.id]=u;});
  var listHtml = '';
  var confirmed_bks = bks.filter(function(b){return b.status==='confirmed';});
  if (!confirmed_bks.length) {
    listHtml = '<div style="color:var(--text-muted);font-size:.8rem;padding:12px 0;">Nessun corsista prenotato.</div>';
  } else {
    confirmed_bks.forEach(function(b) {
      var u = userMap[b.userId];
      if (!u) return;
      var ini = ((u.name||'?')[0] + ((u.surname||'')[0]||'')).toUpperCase();
      listHtml += '<div class="prenotato-item">'
        + '<div class="prenotato-avatar">' + ini + '</div>'
        + '<div><div style="font-weight:700;font-size:.82rem;">' + (u.name||'') + ' ' + (u.surname||'') + '</div>'
        + '<div style="font-size:.72rem;color:var(--text-muted);">' + (u.email||'') + '</div></div></div>';
    });
  }
  document.getElementById('panelPrenotati').innerHTML = listHtml;

  // Pulsante chiudi sala
  document.getElementById('btnPanelChiudi').textContent =
    slot.isActive === false ? 'Riapri sala' : 'Chiudi sala';

  document.getElementById('sidePanel').classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
}

function closePanel() {
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
  panelSlotId = null;
}

async function chiudiSalaPanel() {
  if (!panelSlotId) return;
  var slot     = allSlots.find(function(s){return s.id===panelSlotId;});
  var nuovoStato = slot && slot.isActive === false ? true : false;
  await updateDoc(doc(db,'slots',panelSlotId), {isActive: nuovoStato});
  showToast(nuovoStato ? 'Sala riaperta.' : 'Sala chiusa.', 'info');
  await loadData();
  renderCalendar();
  closePanel();
}

function messaggioPrenotati() {
  if (!panelSlotId) return;
  var userMap = {};
  allUsers.forEach(function(u){userMap[u.id]=u;});
  var bks = allBookings.filter(function(b){return b.slotId===panelSlotId&&b.status==='confirmed';});
  if (!bks.length) { showToast('Nessun prenotato per questa lezione.', 'info'); return; }
  var emails = bks.map(function(b){var u=userMap[b.userId];return u?u.email:'';}).filter(Boolean);
  window.location.href = 'mailto:' + emails.join(',') + '?subject=Comunicazione lezione';
}
