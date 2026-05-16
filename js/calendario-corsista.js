// ============================================================
// js/calendario-corsista.js
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, updateDoc, serverTimestamp
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

var currentWeekStart = getMonday(new Date());
var allSlots      = [];
var allBookings   = [];
var allCourses    = [];
var allRooms      = [];
var allInstructors= [];
var myBookings    = [];
var currentUser   = null;

var DAYS  = ['Lun','Mar','Mer','Gio','Ven','Sab'];
var HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

// ── Auth ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  var snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  var data = snap.data();
  if (data.role === 'admin') { window.location.href = 'dashboard.html'; return; }
  currentUser = Object.assign({ id: user.uid }, data);
  document.body.classList.remove('hidden');
  document.getElementById('corsistaNome').textContent = (data.name||'') + ' ' + (data.surname||'');
  document.getElementById('btnLogout').addEventListener('click', function() {
    signOut(auth).then(function() { window.location.href = 'index.html'; });
  });
  await loadData();
  initUI();
  renderCalendar();
  renderMiePrenotazioni();
});

// ── Helpers ───────────────────────────────────────────────────
function getMonday(d) {
  var dt = new Date(d);
  var day = dt.getDay() || 7;
  dt.setDate(dt.getDate() - day + 1);
  dt.setHours(0,0,0,0);
  return dt;
}
function toYMD(d)     { return d.toISOString().split('T')[0]; }
function addDays(d,n) { var dt=new Date(d); dt.setDate(dt.getDate()+n); return dt; }
function formatDateIt(d)   { return d.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function formatDateLong(d) { return d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'}); }

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
    getDocs(collection(db,'courses')),
    getDocs(collection(db,'rooms')),
    getDocs(collection(db,'instructors'))
  ]);
  allSlots       = results[0].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allBookings    = results[1].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allCourses     = results[2].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allRooms       = results[3].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  allInstructors = results[4].docs.map(function(d){return Object.assign({id:d.id},d.data());});
  myBookings     = allBookings.filter(function(b){return b.userId===currentUser.id;});
}

// ── Init UI ───────────────────────────────────────────────────
function initUI() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'mie') renderMiePrenotazioni();
    });
  });

  // Filtri
  allCourses.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    document.getElementById('filterCorso').appendChild(opt);
  });
  allRooms.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.id; opt.textContent = r.name;
    document.getElementById('filterSala').appendChild(opt);
  });
  document.getElementById('filterCorso').addEventListener('change', renderCalendar);
  document.getElementById('filterSala').addEventListener('change', renderCalendar);

  // Navigazione settimana
  document.getElementById('btnPrevWeek').addEventListener('click', function() {
    currentWeekStart = addDays(currentWeekStart,-7); renderCalendar();
  });
  document.getElementById('btnNextWeek').addEventListener('click', function() {
    currentWeekStart = addDays(currentWeekStart,7); renderCalendar();
  });
  document.getElementById('btnToday').addEventListener('click', function() {
    currentWeekStart = getMonday(new Date()); renderCalendar();
  });

  // Chiudi modal
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function() { closeModal(btn.dataset.close); });
  });
  document.querySelectorAll('.modal-backdrop').forEach(function(bd) {
    bd.addEventListener('click', function(e) {
      if (e.target===bd) closeModal(bd.id);
    });
  });
}

// ── Render calendario ─────────────────────────────────────────
function renderCalendar() {
  var today       = toYMD(new Date());
  var filterCorso = document.getElementById('filterCorso').value;
  var filterSala  = document.getElementById('filterSala').value;
  var endWeek     = addDays(currentWeekStart, 5);

  document.getElementById('calPeriod').textContent =
    formatDateIt(currentWeekStart) + ' — ' + formatDateIt(endWeek);

  // Mappa prenotazioni confermate per slotId
  var bookMap = {};
  allBookings.forEach(function(b) {
    if (b.status !== 'confirmed') return;
    if (!bookMap[b.slotId]) bookMap[b.slotId] = 0;
    bookMap[b.slotId]++;
  });

  // Mie prenotazioni confermate per slotId
  var myConfirmed = {};
  myBookings.forEach(function(b) {
    if (b.status === 'confirmed') myConfirmed[b.slotId] = b.id;
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
      html += '<div class="cal-cell' + (isToday2?' today-col':'') + '">';

      var slotsHere = allSlots.filter(function(s) {
        if (s.date !== ymd2 || s.hour !== hour) return false;
        if (s.isActive === false) return false;
        if (filterCorso && s.courseId !== filterCorso) return false;
        if (filterSala  && s.roomId   !== filterSala)  return false;
        return true;
      });

      slotsHere.forEach(function(slot) {
        var course = allCourses.find(function(c){return c.id===slot.courseId;});
        var istr   = allInstructors.find(function(i){return i.id===slot.instructorId;});
        var bks    = bookMap[slot.id] || 0;
        var cap    = slot.maxCapacity || 5;
        var isFull = bks >= cap;
        var isPrenotato = myConfirmed[slot.id] !== undefined;
        var courseName  = course ? course.name : '—';
        var istrFirst   = istr ? (istr.name||'').split(' ')[0] : '—';
        var postiLabel  = isFull ? 'Completo' : (cap - bks) + ' posti';

        var cls = isFull ? 'completo' : (isPrenotato ? 'prenotato' : 'disponibile');

        html += '<div class="corsista-slot ' + cls + '" data-slotid="' + slot.id + '">'
          + '<div class="slot-name">' + (courseName.length>12 ? courseName.substring(0,11)+'…' : courseName) + '</div>'
          + '<div class="slot-info">' + istrFirst + '</div>'
          + '<div class="slot-info">' + (isPrenotato ? '✓ Prenotato' : postiLabel) + '</div>'
          + '</div>';
      });

      html += '</div>';
    }
  }

  grid.innerHTML = html;

  // Event listeners slot
  grid.querySelectorAll('.corsista-slot').forEach(function(el) {
    el.addEventListener('click', function() {
      var slot = allSlots.find(function(s){return s.id===el.dataset.slotid;});
      if (!slot) return;
      openPopupSlot(slot, myConfirmed, bookMap);
    });
  });
}

// ── Popup slot ────────────────────────────────────────────────
function openPopupSlot(slot, myConfirmed, bookMap) {
  var course = allCourses.find(function(c){return c.id===slot.courseId;});
  var room   = allRooms.find(function(r){return r.id===slot.roomId;});
  var istr   = allInstructors.find(function(i){return i.id===slot.instructorId;});
  var bks    = bookMap[slot.id] || 0;
  var cap    = slot.maxCapacity || 5;
  var isFull = bks >= cap;
  var isPrenotato = myConfirmed[slot.id] !== undefined;
  var bookingId   = myConfirmed[slot.id];
  var hour = String(slot.hour).padStart(2,'0') + ':00';
  var slotDate = new Date(slot.date);

  document.getElementById('modalSlotTitle').textContent = (course&&course.name) || 'Lezione';

  document.getElementById('modalSlotBody').innerHTML = ''
    + '<div class="popup-info-row"><span class="popup-label">Corso</span><span class="popup-val">' + ((course&&course.name)||'—') + '</span></div>'
    + '<div class="popup-info-row"><span class="popup-label">Sala</span><span class="popup-val">' + ((room&&room.name)||'—') + '</span></div>'
    + '<div class="popup-info-row"><span class="popup-label">Istruttore</span><span class="popup-val">' + ((istr&&istr.name)||'—') + '</span></div>'
    + '<div class="popup-info-row"><span class="popup-label">Data</span><span class="popup-val">' + formatDateLong(slotDate) + '</span></div>'
    + '<div class="popup-info-row"><span class="popup-label">Ora</span><span class="popup-val">' + hour + '</span></div>'
    + '<div class="popup-info-row"><span class="popup-label">Disponibilità</span><span class="popup-val">' + (isFull ? 'Completo' : (cap-bks) + ' posti liberi') + '</span></div>';

  var footerHtml = '';
  if (isPrenotato) {
    footerHtml = '<button class="btn btn-ghost" data-close="modalSlot">Chiudi</button>'
      + '<button class="btn btn-danger" id="btnDisdici">Disdici prenotazione</button>';
  } else if (isFull) {
    footerHtml = '<span style="color:var(--magenta);font-size:.82rem;font-weight:700;">Lezione al completo</span>'
      + '<button class="btn btn-ghost" data-close="modalSlot">Chiudi</button>';
  } else {
    footerHtml = '<button class="btn btn-ghost" data-close="modalSlot">Annulla</button>'
      + '<button class="btn btn-primary" id="btnConferma">Conferma prenotazione</button>';
  }
  document.getElementById('modalSlotFooter').innerHTML = footerHtml;

  // Listener [data-close]
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function() { closeModal(btn.dataset.close); });
  });

  var btnConferma = document.getElementById('btnConferma');
  if (btnConferma) {
    btnConferma.addEventListener('click', function() { prenotaSlot(slot.id); });
  }

  var btnDisdici = document.getElementById('btnDisdici');
  if (btnDisdici) {
    btnDisdici.addEventListener('click', function() { disdiciSlot(bookingId); });
  }

  openModal('modalSlot');
}

// ── Prenota ───────────────────────────────────────────────────
async function prenotaSlot(slotId) {
  var slot = allSlots.find(function(s){return s.id===slotId;});
  if (!slot)                 { showToast('Lezione non trovata.','error'); return; }
  if (slot.isActive===false) { showToast('Sala non disponibile.','error'); closeModal('modalSlot'); return; }

  var bks = allBookings.filter(function(b){return b.slotId===slotId&&b.status==='confirmed';}).length;
  if (bks >= (slot.maxCapacity||5)) { showToast('Lezione al completo!','error'); closeModal('modalSlot'); return; }

  var gia = myBookings.find(function(b){return b.slotId===slotId&&b.status==='confirmed';});
  if (gia) { showToast('Hai già prenotato questa lezione.','info'); closeModal('modalSlot'); return; }

  try {
    var newBook = { userId:currentUser.id, slotId:slotId, status:'confirmed', createdAt:serverTimestamp() };
    var ref = await addDoc(collection(db,'bookings'), newBook);
    myBookings.push(Object.assign({id:ref.id}, newBook));
    allBookings.push(Object.assign({id:ref.id}, newBook));

    // Scala credito se a lezione prepagata
    if (currentUser.paymentType === 'lesson' && (currentUser.creditBalance||0) > 0) {
      await updateDoc(doc(db,'users',currentUser.id), {
        creditBalance: (currentUser.creditBalance||1) - 1
      });
      currentUser.creditBalance = (currentUser.creditBalance||1) - 1;
    }

    closeModal('modalSlot');
    showToast('Prenotazione confermata!','success');
    renderCalendar();
  } catch(err) {
    showToast('Errore nella prenotazione.','error');
  }
}

// ── Disdici ───────────────────────────────────────────────────
async function disdiciSlot(bookingId) {
  try {
    await updateDoc(doc(db,'bookings',bookingId), {
      status:'cancelled', cancelledAt:serverTimestamp()
    });
    var bk = myBookings.find(function(b){return b.id===bookingId;});
    if (bk) bk.status = 'cancelled';
    var bkAll = allBookings.find(function(b){return b.id===bookingId;});
    if (bkAll) bkAll.status = 'cancelled';

    closeModal('modalSlot');
    showToast('Prenotazione disdetta.','info');
    renderCalendar();
    renderMiePrenotazioni();
  } catch(err) {
    showToast('Errore nella disdetta.','error');
  }
}

// ── Le mie prenotazioni ───────────────────────────────────────
function renderMiePrenotazioni() {
  var container = document.getElementById('listaMiePrenotazioni');
  var today     = new Date(); today.setHours(0,0,0,0);

  var courseMap = {}; allCourses.forEach(function(c){courseMap[c.id]=c;});
  var roomMap   = {}; allRooms.forEach(function(r){roomMap[r.id]=r;});
  var istrMap   = {}; allInstructors.forEach(function(i){istrMap[i.id]=i;});
  var slotMap   = {}; allSlots.forEach(function(s){slotMap[s.id]=s;});

  var confBks  = myBookings.filter(function(b){return b.status==='confirmed';});
  var prossime = [], passate = [];

  confBks.forEach(function(b) {
    var slot = slotMap[b.slotId];
    if (!slot) return;
    var slotDate = new Date(slot.date);
    if (slotDate >= today) prossime.push({b:b, slot:slot});
    else                   passate.push({b:b, slot:slot});
  });

  prossime.sort(function(a,b_){return a.slot.date>b_.slot.date?1:-1;});
  passate.sort(function(a,b_){return a.slot.date>b_.slot.date?-1:1;});

  var html = '';

  if (!prossime.length && !passate.length) {
    html = '<div style="text-align:center;padding:40px;color:var(--text-muted);">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="margin:0 auto 12px;opacity:.3;display:block;">'
      + '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>'
      + '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
      + '<div style="font-weight:700;">Nessuna prenotazione</div>'
      + '<div style="font-size:.78rem;margin-top:6px;">Vai su "Prenota lezione" per prenotare.</div></div>';
    container.innerHTML = html; return;
  }

  if (prossime.length) {
    html += '<div class="section-label">Prossime lezioni (' + prossime.length + ')</div>';
    prossime.forEach(function(item) {
      var corso = courseMap[item.slot.courseId];
      var sala  = roomMap[item.slot.roomId];
      var istr  = istrMap[item.slot.instructorId];
      var hour  = String(item.slot.hour).padStart(2,'0') + ':00';
      html += '<div class="prenotazione-card">'
        + '<div class="pren-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>'
        + '<div class="pren-info">'
        + '<div class="pren-corso">' + ((corso&&corso.name)||'Lezione') + '</div>'
        + '<div class="pren-details">' + formatDateLong(new Date(item.slot.date)) + ' · ' + hour + ' · ' + ((sala&&sala.name)||'—') + ' · ' + ((istr&&istr.name)||'—') + '</div>'
        + '</div>'
        + '<button class="btn btn-danger" style="font-size:.75rem;padding:6px 12px;white-space:nowrap;" data-bookid="' + item.b.id + '">Disdici</button>'
        + '</div>';
    });
  }

  if (passate.length) {
    html += '<div class="section-label" style="margin-top:24px;">Lezioni passate (ultime ' + Math.min(passate.length,10) + ')</div>';
    passate.slice(0,10).forEach(function(item) {
      var corso = courseMap[item.slot.courseId];
      var sala  = roomMap[item.slot.roomId];
      var hour  = String(item.slot.hour).padStart(2,'0') + ':00';
      html += '<div class="prenotazione-card" style="opacity:.75;">'
        + '<div class="pren-icon" style="background:#e6f7ee;color:#1a8a45;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg></div>'
        + '<div class="pren-info">'
        + '<div class="pren-corso">' + ((corso&&corso.name)||'Lezione') + '</div>'
        + '<div class="pren-details">' + formatDateLong(new Date(item.slot.date)) + ' · ' + hour + ' · ' + ((sala&&sala.name)||'—') + '</div>'
        + '</div>'
        + '<span class="badge badge-active">Effettuata</span>'
        + '</div>';
    });
  }

  container.innerHTML = html;

  // Listener disdici
  container.querySelectorAll('[data-bookid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('Vuoi disdire questa prenotazione?')) disdiciSlot(btn.dataset.bookid);
    });
  });
}
