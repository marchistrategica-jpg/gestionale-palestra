// ============================================================
// js/calendario-corsista.js — Mobile first
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

var currentUser    = null;
var allSlots       = [];
var allBookings    = [];
var allCourses     = [];
var allRooms       = [];
var allInstructors = [];
var myBookings     = [];
var currentDate    = new Date();

var DAYS_IT   = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
var DAYS_SHORT= ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
var MONTHS_IT = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
var HOURS     = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

// ── Auth ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  var snap = await getDoc(doc(db,'users',user.uid));
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  var data = snap.data();
  if (data.role === 'admin') { window.location.href = 'dashboard.html'; return; }
  currentUser = Object.assign({id:user.uid}, data);
  document.body.classList.remove('hidden');

  // Nome in topbar
  document.getElementById('corsistaNome').textContent = (data.name||'') + ' ' + (data.surname||'');

  // Credito
  if (data.paymentType === 'lesson') {
    var banner = document.getElementById('creditoBanner');
    banner.style.display = 'flex';
    document.getElementById('creditoNum').textContent = data.creditBalance || 0;
  }

  // Logout
  document.getElementById('btnLogout').addEventListener('click', function() {
    signOut(auth).then(function(){ window.location.href = 'index.html'; });
  });

  await loadData();
  initUI();
  renderDay();
  renderMiePrenotazioni();
});

// ── Helpers ───────────────────────────────────────────────────
function toYMD(d)     { return d.toISOString().split('T')[0]; }
function addDays(d,n) { var dt=new Date(d); dt.setDate(dt.getDate()+n); return dt; }

function formatDateLong(d) {
  return DAYS_IT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_IT[d.getMonth()] + ' ' + d.getFullYear();
}

function showToast(msg, type) {
  type = type||'success';
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + msg + '</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(function(){el.remove();}, 3500);
}

function openSheet()  { document.getElementById('sheetOverlay').classList.add('open'); }
function closeSheet() { document.getElementById('sheetOverlay').classList.remove('open'); }

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
  // Tab switching
  document.querySelectorAll('.tab-bar-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-bar-btn').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.tab-pane').forEach(function(p){p.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'mie') renderMiePrenotazioni();
    });
  });

  // Navigazione giorni
  document.getElementById('btnPrevDay').addEventListener('click', function() {
    currentDate = addDays(currentDate, -1);
    renderDay();
  });
  document.getElementById('btnNextDay').addEventListener('click', function() {
    currentDate = addDays(currentDate, 1);
    renderDay();
  });
  document.getElementById('btnOggi').addEventListener('click', function() {
    currentDate = new Date();
    renderDay();
  });

  // Filtri
  allCourses.forEach(function(c) {
    var o=document.createElement('option'); o.value=c.id; o.textContent=c.name;
    document.getElementById('filterCorso').appendChild(o);
  });
  allRooms.forEach(function(r) {
    var o=document.createElement('option'); o.value=r.id; o.textContent=r.name;
    document.getElementById('filterSala').appendChild(o);
  });
  document.getElementById('filterCorso').addEventListener('change', renderDay);
  document.getElementById('filterSala').addEventListener('change', renderDay);

  // Chiudi sheet cliccando overlay
  document.getElementById('sheetOverlay').addEventListener('click', function(e) {
    if (e.target === document.getElementById('sheetOverlay')) closeSheet();
  });
}

// ── Render giorno ─────────────────────────────────────────────
function renderDay() {
  var today       = toYMD(new Date());
  var selYmd      = toYMD(currentDate);
  var filterCorso = document.getElementById('filterCorso').value;
  var filterSala  = document.getElementById('filterSala').value;

  // Aggiorna header
  document.getElementById('navWeekday').textContent = DAYS_IT[currentDate.getDay()];
  var dateEl = document.getElementById('navDate');
  dateEl.textContent = currentDate.getDate() + ' ' + MONTHS_IT[currentDate.getMonth()];
  dateEl.className   = 'day-nav-date' + (selYmd===today?' today-date':'');

  // Pills settimana
  renderWeekPills(selYmd, today);

  // Mappa prenotazioni confermate
  var bookMap = {};
  allBookings.forEach(function(b) {
    if (b.status!=='confirmed') return;
    bookMap[b.slotId] = (bookMap[b.slotId]||0) + 1;
  });
  var myConfirmed = {};
  myBookings.forEach(function(b) {
    if (b.status==='confirmed') myConfirmed[b.slotId] = b.id;
  });

  // Filtra slot del giorno
  var slotsDay = allSlots.filter(function(s) {
    if (s.date !== selYmd) return false;
    if (s.isActive === false) return false;
    if (filterCorso && s.courseId !== filterCorso) return false;
    if (filterSala  && s.roomId   !== filterSala)  return false;
    return true;
  }).sort(function(a,b){return a.hour-b.hour;});

  var container = document.getElementById('slotsList');

  if (!slotsDay.length) {
    container.innerHTML = ''
      + '<div class="empty-day">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
      + '<div class="empty-day-title">Nessuna lezione</div>'
      + '<div class="empty-day-sub">Non ci sono lezioni programmate per questo giorno.</div>'
      + '</div>';
    return;
  }

  var html = '';
  slotsDay.forEach(function(slot) {
    var course  = allCourses.find(function(c){return c.id===slot.courseId;});
    var room    = allRooms.find(function(r){return r.id===slot.roomId;});
    var istr    = allInstructors.find(function(i){return i.id===slot.instructorId;});
    var bks     = bookMap[slot.id] || 0;
    var cap     = slot.maxCapacity || 5;
    var isFull  = bks >= cap;
    var isPrenotato = myConfirmed[slot.id] !== undefined;
    var pct     = Math.round((bks/cap)*100);
    var posti   = cap - bks;
    var hour    = String(slot.hour).padStart(2,'0') + ':00';

    var stato = 'disponibile';
    if (isFull)       stato = 'completo';
    if (isPrenotato)  stato = 'prenotato';

    var badgeLabel = stato==='disponibile' ? (posti===1?'1 posto':'Disponibile')
                   : stato==='prenotato'  ? '✓ Prenotato'
                   : stato==='completo'   ? 'Completo'
                   : 'Chiuso';

    var fillCls = pct >= 100 ? 'full' : pct >= 60 ? 'warn' : 'ok';

    html += '<div class="slot-card-mobile ' + stato + '" data-slotid="' + slot.id + '">'
      + '<div class="slot-color-bar ' + stato + '"></div>'
      + '<div class="slot-body">'
      + '<div class="slot-header">'
      + '<div class="slot-ora">' + hour + '</div>'
      + '<div class="slot-badge ' + stato + '">' + badgeLabel + '</div>'
      + '</div>'
      + '<div class="slot-corso">' + (course&&course.name||'Lezione') + '</div>'
      + '<div class="slot-details">'
      + (istr?'<div class="slot-detail-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>' + istr.name + '</div>':'')
      + (room?'<div class="slot-detail-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' + room.name + '</div>':'')
      + '</div>'
      + '<div class="slot-posti">'
      + '<div class="slot-posti-txt">' + bks + '/' + cap + ' posti occupati</div>'
      + '<div class="slot-posti-bar"><div class="slot-posti-fill ' + fillCls + '" style="width:' + pct + '%"></div></div>'
      + '</div>'
      + '</div></div>';
  });

  container.innerHTML = html;

  // Listener slot
  container.querySelectorAll('.slot-card-mobile').forEach(function(card) {
    if (card.classList.contains('completo') || card.classList.contains('chiuso')) {
      card.addEventListener('click', function() {
        var slot = allSlots.find(function(s){return s.id===card.dataset.slotid;});
        var course = allCourses.find(function(c){return c.id===slot.courseId;});
        openSheetInfo(slot, course, null, null, 'completo');
      });
      return;
    }
    card.addEventListener('click', function() {
      var slotId = card.dataset.slotid;
      var slot   = allSlots.find(function(s){return s.id===slotId;});
      var isPrenotato = myConfirmed[slotId] !== undefined;
      var bookingId   = myConfirmed[slotId];
      var course  = allCourses.find(function(c){return c.id===slot.courseId;});
      var room    = allRooms.find(function(r){return r.id===slot.roomId;});
      var istr    = allInstructors.find(function(i){return i.id===slot.instructorId;});
      openSheetSlot(slot, course, room, istr, isPrenotato, bookingId, bookMap);
    });
  });
}

// ── Pills settimana ───────────────────────────────────────────
function renderWeekPills(selYmd, today) {
  // Trova il lunedì della settimana corrente
  var d = new Date(currentDate);
  var dow = d.getDay() || 7;
  d.setDate(d.getDate() - dow + 1);

  // Slot del giorno con prenotazioni
  var slotsPerDay = {};
  allSlots.forEach(function(s) { slotsPerDay[s.date] = true; });

  var html = '';
  for (var i=0; i<6; i++) {
    var day    = addDays(d, i);
    var ymd    = toYMD(day);
    var isToday= ymd === today;
    var isSel  = ymd === selYmd;
    var hasSlot= slotsPerDay[ymd];
    var cls    = '';
    if (isSel)    cls += ' active';
    if (isToday && !isSel) cls += ' today-pill';
    if (hasSlot && !isSel) cls += ' has-slots';

    html += '<div class="week-pill' + cls + '" data-ymd="' + ymd + '">'
      + '<div class="wd">' + DAYS_SHORT[day.getDay()] + '</div>'
      + '<div class="dd">' + day.getDate() + '</div>'
      + '</div>';
  }

  var container = document.getElementById('weekPills');
  container.innerHTML = html;
  container.querySelectorAll('.week-pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      currentDate = new Date(pill.dataset.ymd + 'T12:00:00');
      renderDay();
    });
  });
}

// ── Bottom sheet slot ─────────────────────────────────────────
function openSheetSlot(slot, course, room, istr, isPrenotato, bookingId, bookMap) {
  var bks  = (bookMap[slot.id]||0);
  var cap  = slot.maxCapacity || 5;
  var hour = String(slot.hour).padStart(2,'0') + ':00';
  var slotDate = new Date(slot.date + 'T12:00:00');

  document.getElementById('sheetTitle').textContent = (course&&course.name)||'Lezione';
  document.getElementById('sheetSub').textContent   = formatDateLong(slotDate) + ' · ' + hour;

  document.getElementById('sheetBody').innerHTML = ''
    + '<div class="sheet-info-row"><span class="sheet-info-label">Sala</span><span class="sheet-info-val">' + ((room&&room.name)||'—') + '</span></div>'
    + '<div class="sheet-info-row"><span class="sheet-info-label">Istruttore</span><span class="sheet-info-val">' + ((istr&&istr.name)||'—') + '</span></div>'
    + '<div class="sheet-info-row"><span class="sheet-info-label">Posti disponibili</span><span class="sheet-info-val">' + (cap-bks) + ' su ' + cap + '</span></div>';

  var footer = '';
  if (isPrenotato) {
    footer = '<button class="btn-sheet-danger" id="btnDisdici">Disdici prenotazione</button>'
           + '<button class="btn-sheet-ghost" id="btnChiudi">Chiudi</button>';
  } else {
    footer = '<button class="btn-sheet-confirm" id="btnConferma">Conferma prenotazione</button>'
           + '<button class="btn-sheet-ghost" id="btnChiudi">Annulla</button>';
  }
  document.getElementById('sheetFooter').innerHTML = footer;

  var btnChiudi = document.getElementById('btnChiudi');
  if (btnChiudi) btnChiudi.addEventListener('click', closeSheet);

  var btnConferma = document.getElementById('btnConferma');
  if (btnConferma) btnConferma.addEventListener('click', function() { prenotaSlot(slot.id); });

  var btnDisdici = document.getElementById('btnDisdici');
  if (btnDisdici) btnDisdici.addEventListener('click', function() { disdiciSlot(bookingId); });

  openSheet();
}

function openSheetInfo(slot, course, room, istr, tipo) {
  var hour = String(slot.hour).padStart(2,'0') + ':00';
  document.getElementById('sheetTitle').textContent = (course&&course.name)||'Lezione';
  document.getElementById('sheetSub').textContent   = hour;
  document.getElementById('sheetBody').innerHTML = ''
    + '<div class="sheet-info-row"><span class="sheet-info-label">Stato</span>'
    + '<span class="sheet-info-val" style="color:var(--magenta);">'
    + (tipo==='completo'?'Lezione al completo — nessun posto disponibile':'Sala non disponibile')
    + '</span></div>';
  document.getElementById('sheetFooter').innerHTML =
    '<button class="btn-sheet-ghost" id="btnChiudi">Chiudi</button>';
  document.getElementById('btnChiudi').addEventListener('click', closeSheet);
  openSheet();
}

// ── Prenota ───────────────────────────────────────────────────
async function prenotaSlot(slotId) {
  var slot = allSlots.find(function(s){return s.id===slotId;});
  if (!slot||slot.isActive===false) { showToast('Sala non disponibile.','error'); closeSheet(); return; }

  var bks = allBookings.filter(function(b){return b.slotId===slotId&&b.status==='confirmed';}).length;
  if (bks>=(slot.maxCapacity||5)) { showToast('Lezione al completo!','error'); closeSheet(); return; }

  var gia = myBookings.find(function(b){return b.slotId===slotId&&b.status==='confirmed';});
  if (gia) { showToast('Hai già prenotato questa lezione.','info'); closeSheet(); return; }

  try {
    var newBook = {userId:currentUser.id, slotId:slotId, status:'confirmed', createdAt:serverTimestamp()};
    var ref = await addDoc(collection(db,'bookings'), newBook);
    myBookings.push(Object.assign({id:ref.id}, newBook));
    allBookings.push(Object.assign({id:ref.id}, newBook));

    if (currentUser.paymentType==='lesson' && (currentUser.creditBalance||0)>0) {
      await updateDoc(doc(db,'users',currentUser.id), {creditBalance:(currentUser.creditBalance||1)-1});
      currentUser.creditBalance = (currentUser.creditBalance||1)-1;
      document.getElementById('creditoNum').textContent = currentUser.creditBalance;
    }

    closeSheet();
    showToast('Prenotazione confermata! 🎉','success');
    renderDay();
  } catch(err) { showToast('Errore: '+err.message,'error'); }
}

// ── Disdici ───────────────────────────────────────────────────
async function disdiciSlot(bookingId) {
  try {
    await updateDoc(doc(db,'bookings',bookingId), {status:'cancelled', cancelledAt:serverTimestamp()});
    var bk    = myBookings.find(function(b){return b.id===bookingId;});
    var bkAll = allBookings.find(function(b){return b.id===bookingId;});
    if (bk)    bk.status    = 'cancelled';
    if (bkAll) bkAll.status = 'cancelled';
    closeSheet();
    showToast('Prenotazione disdetta.','info');
    renderDay();
    renderMiePrenotazioni();
  } catch(err) { showToast('Errore: '+err.message,'error'); }
}

// ── Le mie prenotazioni ───────────────────────────────────────
function renderMiePrenotazioni() {
  var container = document.getElementById('miePrenotazioniContent');
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
    var slotDate = new Date(slot.date + 'T12:00:00');
    if (slotDate >= today) prossime.push({b:b,slot:slot});
    else                   passate.push({b:b,slot:slot});
  });

  prossime.sort(function(a,b_){return a.slot.date>b_.slot.date?1:-1;});
  passate.sort(function(a,b_) {return a.slot.date>b_.slot.date?-1:1;});

  if (!prossime.length && !passate.length) {
    container.innerHTML = ''
      + '<div class="empty-day" style="margin-top:20px;">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
      + '<div class="empty-day-title">Nessuna prenotazione</div>'
      + '<div class="empty-day-sub">Vai su "Prenota lezione" per iscriverti a una lezione.</div>'
      + '</div>';
    return;
  }

  var html = '';

  if (prossime.length) {
    html += '<div class="pren-section-label" style="margin-top:14px;">Prossime lezioni</div>';
    html += '<div class="pren-list">';
    prossime.forEach(function(item) {
      var corso = courseMap[item.slot.courseId];
      var sala  = roomMap[item.slot.roomId];
      var istr  = istrMap[item.slot.instructorId];
      var hour  = String(item.slot.hour).padStart(2,'0')+':00';
      var d     = new Date(item.slot.date+'T12:00:00');
      html += '<div class="pren-card">'
        + '<div class="pren-icon future"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>'
        + '<div class="pren-info">'
        + '<div class="pren-corso">' + ((corso&&corso.name)||'Lezione') + '</div>'
        + '<div class="pren-data">' + formatDateLong(d) + ' · ' + hour + (sala?' · '+sala.name:'') + '</div>'
        + '</div>'
        + '<button class="btn btn-danger" style="font-size:.72rem;padding:6px 10px;white-space:nowrap;flex-shrink:0;" data-bookid="' + item.b.id + '">Disdici</button>'
        + '</div>';
    });
    html += '</div>';
  }

  if (passate.length) {
    html += '<div class="pren-section-label" style="margin-top:8px;">Lezioni passate</div>';
    html += '<div class="pren-list">';
    passate.slice(0,10).forEach(function(item) {
      var corso = courseMap[item.slot.courseId];
      var sala  = roomMap[item.slot.roomId];
      var hour  = String(item.slot.hour).padStart(2,'0')+':00';
      var d     = new Date(item.slot.date+'T12:00:00');
      html += '<div class="pren-card" style="opacity:.75;">'
        + '<div class="pren-icon past"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>'
        + '<div class="pren-info">'
        + '<div class="pren-corso">' + ((corso&&corso.name)||'Lezione') + '</div>'
        + '<div class="pren-data">' + formatDateLong(d) + ' · ' + hour + (sala?' · '+sala.name:'') + '</div>'
        + '</div>'
        + '<span class="badge badge-active" style="flex-shrink:0;">Effettuata</span>'
        + '</div>';
    });
    html += '</div>';
  }

  container.innerHTML = html;

  container.querySelectorAll('[data-bookid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('Vuoi disdire questa prenotazione?')) disdiciSlot(btn.dataset.bookid);
    });
  });
}
