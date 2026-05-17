// ============================================================
// js/messaggi.js
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc, serverTimestamp
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

var allSoci      = [];
var allTemplates = [];
var selectedSoci = [];
var currentStep  = 1;
var editingTplId = null;
var waQueue      = [];
var waIndex      = 0;

// ── Auth ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  var snap = await getDoc(doc(db,'users',user.uid));
  if (!snap.exists()||snap.data().role!=='admin') {
    window.location.href = 'index.html'; return;
  }
  document.body.classList.remove('hidden');
  initSidebar(snap.data());
  await loadData();
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

// ── Carica dati ───────────────────────────────────────────────
async function loadData() {
  var results = await Promise.all([
    getDocs(collection(db,'users')),
    getDocs(collection(db,'templates'))
  ]);
  allSoci      = results[0].docs.map(function(d){return Object.assign({id:d.id},d.data());})
                  .filter(function(u){return u.role==='corsista';});
  allTemplates = results[1].docs.map(function(d){return Object.assign({id:d.id},d.data());});
}

// ── Helpers ───────────────────────────────────────────────────
function avatarColor(name) {
  var colors=['#0f507b','#e6165c','#1a8a45','#c9821a','#6b3fa0','#0e7490'];
  return colors[((name||'').charCodeAt(0)||0)%colors.length];
}
function formatDate(ts) {
  if (!ts) return '—';
  var d = ts.toDate?ts.toDate():new Date(ts);
  return d.toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
}
function today() {
  return new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
}
function showToast(msg,type) {
  type=type||'success';
  var el=document.createElement('div'); el.className='toast '+type;
  el.innerHTML='<span>'+msg+'</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(function(){el.remove();},3500);
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Sostituisce variabili nel testo con i dati del socio
function sostituisciVariabili(testo, socio) {
  var expiry = '';
  if (socio.subscriptionExpiry) expiry = formatDate(socio.subscriptionExpiry);
  var importo = socio.paymentType==='subscription'
    ? '€'+(socio.subscriptionAmount||'—')
    : '€20';
  return testo
    .replace(/{nome}/g,     socio.name||'')
    .replace(/{cognome}/g,  socio.surname||'')
    .replace(/{corso}/g,    '[corso]')
    .replace(/{sala}/g,     '[sala]')
    .replace(/{ora}/g,      '[ora]')
    .replace(/{giorno}/g,   '[giorno]')
    .replace(/{data}/g,     today())
    .replace(/{scadenza}/g, expiry)
    .replace(/{importo}/g,  importo);
}

// ── Calcola destinatari in base alla selezione ────────────────
function calcolaDestinatari() {
  var tipo = document.querySelector('input[name="destinatari"]:checked').value;
  if (tipo==='tutti') {
    return allSoci.filter(function(s){return s.status!=='sospeso';});
  }
  if (tipo==='scadenza') {
    var now   = new Date();
    var in7   = new Date(now.getTime()+7*86400000);
    return allSoci.filter(function(s) {
      if (s.paymentType!=='subscription'||!s.subscriptionExpiry) return false;
      var exp = s.subscriptionExpiry.toDate?s.subscriptionExpiry.toDate():new Date(s.subscriptionExpiry);
      return exp>=now && exp<=in7;
    });
  }
  if (tipo==='manuale') {
    var checked = document.querySelectorAll('#sociCheckList input[type="checkbox"]:checked');
    var ids     = Array.from(checked).map(function(cb){return cb.dataset.id;});
    return allSoci.filter(function(s){return ids.indexOf(s.id)!==-1;});
  }
  return [];
}

// ── Init UI ───────────────────────────────────────────────────
function initUI() {
  renderTemplates();
  populateTemplateSelect();
  renderSociCheckList(allSoci);

  // Radio destinatari
  document.querySelectorAll('input[name="destinatari"]').forEach(function(r) {
    r.addEventListener('change', function() {
      document.querySelectorAll('label[id^="lbl"]').forEach(function(l){
        if (l.id==='lblTutti'||l.id==='lblScadenza'||l.id==='lblManuale') l.classList.remove('selected');
      });
      r.parentElement.classList.add('selected');
      var isManuale = r.value==='manuale';
      document.getElementById('selezioneManuale').style.display = isManuale?'block':'none';
      aggiornaCounterDestinatari();
    });
  });

  // Ricerca soci
  document.getElementById('searchSoci').addEventListener('input', function() {
    var q = this.value.toLowerCase();
    var filtrati = allSoci.filter(function(s) {
      return ((s.name||'')+(s.surname||'')+(s.email||'')).toLowerCase().indexOf(q)!==-1;
    });
    renderSociCheckList(filtrati);
  });

  document.getElementById('btnSelTutti').addEventListener('click', function() {
    document.querySelectorAll('#sociCheckList input[type="checkbox"]').forEach(function(cb){cb.checked=true;});
    aggiornaCounterDestinatari();
  });
  document.getElementById('btnSelNessuno').addEventListener('click', function() {
    document.querySelectorAll('#sociCheckList input[type="checkbox"]').forEach(function(cb){cb.checked=false;});
    aggiornaCounterDestinatari();
  });

  // Radio tipo messaggio
  document.querySelectorAll('input[name="tipoMsg"]').forEach(function(r) {
    r.addEventListener('change', function() {
      document.getElementById('lblWA').classList.toggle('selected', r.value==='whatsapp');
      document.getElementById('lblEmail').classList.toggle('selected', r.value==='email');
      document.getElementById('oggettoWrap').style.display = r.value==='email'?'block':'none';
      aggiornaAnteprima();
    });
  });

  // Template select
  document.getElementById('selectTemplate').addEventListener('change', function() {
    var tplId = this.value;
    if (!tplId) return;
    var tpl = allTemplates.find(function(t){return t.id===tplId;});
    if (!tpl) return;
    document.getElementById('msgTesto').value = tpl.body||'';
    if (tpl.subject) document.getElementById('msgOggetto').value = tpl.subject;
    // Imposta tipo
    var isEmail = tpl.type==='email';
    document.querySelector('input[name="tipoMsg"][value="'+(isEmail?'email':'whatsapp')+'"]').checked=true;
    document.getElementById('lblWA').classList.toggle('selected', !isEmail);
    document.getElementById('lblEmail').classList.toggle('selected', isEmail);
    document.getElementById('oggettoWrap').style.display = isEmail?'block':'none';
    aggiornaAnteprima();
  });

  // Textarea → anteprima live
  document.getElementById('msgTesto').addEventListener('input', aggiornaAnteprima);

  // Variabili cliccabili (invia messaggio)
  document.querySelectorAll('#varChips .var-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var textarea = document.getElementById('msgTesto');
      var v = chip.dataset.var;
      var s = textarea.selectionStart; var e = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0,s) + v + textarea.value.substring(e);
      textarea.selectionStart = textarea.selectionEnd = s+v.length;
      textarea.focus();
      aggiornaAnteprima();
    });
  });

  // Variabili cliccabili (modal template)
  document.querySelectorAll('#tplVarChips .var-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var textarea = document.getElementById('tplBody');
      var v = chip.dataset.var;
      var s = textarea.selectionStart; var e = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0,s) + v + textarea.value.substring(e);
      textarea.selectionStart = textarea.selectionEnd = s+v.length;
      textarea.focus();
    });
  });

  // Radio tipo template modal
  document.querySelectorAll('input[name="tplTipo"]').forEach(function(r) {
    r.addEventListener('change', function() {
      document.getElementById('tplLblWA').classList.toggle('selected', r.value==='whatsapp');
      document.getElementById('tplLblEmail').classList.toggle('selected', r.value==='email');
      document.getElementById('tplOggettoWrap').style.display = r.value==='email'?'block':'none';
    });
  });

  // Navigazione step
  document.getElementById('btnStep1Next').addEventListener('click', function() {
    selectedSoci = calcolaDestinatari();
    if (!selectedSoci.length) { showToast('Seleziona almeno un destinatario.','error'); return; }
    goToStep(2);
  });
  document.getElementById('btnStep2Back').addEventListener('click', function(){goToStep(1);});
  document.getElementById('btnStep2Next').addEventListener('click', function() {
    var testo = document.getElementById('msgTesto').value.trim();
    if (!testo) { showToast('Scrivi un messaggio.','error'); return; }
    goToStep(3);
    aggiornaRiepilogo();
  });
  document.getElementById('btnStep3Back').addEventListener('click', function(){goToStep(2);});
  document.getElementById('btnInvia').addEventListener('click', inviaMassaggio);

  // WA step-by-step
  document.getElementById('btnWAApri').addEventListener('click', function() {
    if (waIndex<waQueue.length) {
      window.open(waQueue[waIndex].link, '_blank');
    }
  });
  document.getElementById('btnWANext').addEventListener('click', function() {
    waIndex++;
    if (waIndex>=waQueue.length) {
      document.getElementById('waPanelStep').classList.remove('visible');
      showToast('Tutti i messaggi WhatsApp inviati!','success');
      resetForm();
    } else {
      aggiornaWAPanel();
    }
  });
  document.getElementById('btnWAFine').addEventListener('click', function() {
    document.getElementById('waPanelStep').classList.remove('visible');
    showToast('Invio completato.','info');
    resetForm();
  });

  // Template modal
  document.getElementById('btnNuovoTemplate').addEventListener('click', function() {
    editingTplId = null;
    document.getElementById('modalTemplateTitle').textContent = 'Nuovo Template';
    document.getElementById('tplNome').value    = '';
    document.getElementById('tplBody').value    = '';
    document.getElementById('tplOggetto').value = '';
    document.getElementById('tplLblWA').classList.add('selected');
    document.getElementById('tplLblEmail').classList.remove('selected');
    document.querySelector('input[name="tplTipo"][value="whatsapp"]').checked = true;
    document.getElementById('tplOggettoWrap').style.display = 'none';
    openModal('modalTemplate');
  });
  document.getElementById('btnSalvaTemplate').addEventListener('click', salvaTemplate);

  // Chiudi modal
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function(){closeModal(btn.dataset.close);});
  });
  document.querySelectorAll('.modal-backdrop').forEach(function(bd) {
    bd.addEventListener('click', function(e){if(e.target===bd)closeModal(bd.id);});
  });

  aggiornaCounterDestinatari();
  aggiornaAnteprima();
}

// ── Step navigation ───────────────────────────────────────────
function goToStep(n) {
  currentStep = n;
  document.querySelectorAll('.step-section').forEach(function(s,i){
    s.classList.toggle('active', i===n-1);
  });
  document.querySelectorAll('.step').forEach(function(s,i){
    s.classList.remove('active','done');
    if (i===n-1) s.classList.add('active');
    if (i<n-1)   s.classList.add('done');
  });
}

// ── Lista soci con checkbox ───────────────────────────────────
function renderSociCheckList(soci) {
  var container = document.getElementById('sociCheckList');
  if (!soci.length) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:.8rem;">Nessun socio trovato.</div>';
    return;
  }
  var html = '';
  soci.forEach(function(s) {
    var color = avatarColor(s.name);
    var ini   = ((s.name||'?')[0]+((s.surname||'')[0]||'')).toUpperCase();
    html += '<label class="socio-row">'
      + '<input type="checkbox" data-id="' + s.id + '" />'
      + '<div class="socio-avatar-sm" style="background:' + color + ';">' + ini + '</div>'
      + '<div class="socio-name-sm">' + (s.name||'') + ' ' + (s.surname||'') + '</div>'
      + '<div class="socio-email-sm">' + (s.email||'') + '</div>'
      + '</label>';
  });
  container.innerHTML = html;
  container.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
    cb.addEventListener('change', aggiornaCounterDestinatari);
  });
}

function aggiornaCounterDestinatari() {
  var n = calcolaDestinatari().length;
  document.getElementById('selectedCount').textContent = n;
}

// ── Anteprima messaggio ───────────────────────────────────────
function aggiornaAnteprima() {
  var testo   = document.getElementById('msgTesto').value;
  var socio   = selectedSoci.length ? selectedSoci[0] : (allSoci.length ? allSoci[0] : null);
  var anteEl  = document.getElementById('anteprimaBox');
  if (!testo) { anteEl.textContent = 'Il messaggio apparirà qui…'; return; }
  if (!socio) { anteEl.textContent = testo; return; }
  anteEl.textContent = sostituisciVariabili(testo, socio);
}

// ── Riepilogo step 3 ──────────────────────────────────────────
function aggiornaRiepilogo() {
  var tipo   = document.querySelector('input[name="tipoMsg"]:checked').value;
  var n      = selectedSoci.length;
  var testo  = document.getElementById('msgTesto').value;
  var riel   = document.getElementById('riepilogoInvio');
  var btnLbl = document.getElementById('btnInviaLabel');

  var tipoLabel = tipo==='whatsapp' ? 'WhatsApp' : 'Email';
  riel.innerHTML = ''
    + '<div style="display:flex;flex-direction:column;gap:8px;">'
    + '<div><strong>Tipo:</strong> ' + tipoLabel + '</div>'
    + '<div><strong>Destinatari:</strong> ' + n + ' soci</div>'
    + '<div><strong>Anteprima:</strong> <em style="color:var(--text-muted);">' + testo.substring(0,80) + (testo.length>80?'…':'') + '</em></div>'
    + '</div>';

  if (tipo==='whatsapp') {
    btnLbl.textContent = 'Avvia invio WhatsApp (' + n + ')';
  } else {
    btnLbl.textContent = 'Apri Email (' + n + ' destinatari)';
  }
}

// ── Invia ─────────────────────────────────────────────────────
function inviaMassaggio() {
  var tipo   = document.querySelector('input[name="tipoMsg"]:checked').value;
  var testo  = document.getElementById('msgTesto').value.trim();
  var oggetto= document.getElementById('msgOggetto').value.trim() || 'Messaggio dalla palestra';

  if (!testo)             { showToast('Scrivi un messaggio.','error'); return; }
  if (!selectedSoci.length){ showToast('Nessun destinatario.','error'); return; }

  if (tipo==='whatsapp') {
    // Costruisce la coda WA
    waQueue = [];
    selectedSoci.forEach(function(s) {
      if (!s.phone) return;
      var phone = s.phone.replace(/\D/g,'');
      var msg   = sostituisciVariabili(testo, s);
      waQueue.push({ name:(s.name||'')+ ' '+(s.surname||''), link:'https://wa.me/'+phone+'?text='+encodeURIComponent(msg) });
    });
    if (!waQueue.length) { showToast('Nessun socio ha un numero di telefono.','error'); return; }
    waIndex = 0;
    document.getElementById('waPanelStep').classList.add('visible');
    aggiornaWAPanel();
  } else {
    // Email: mailto con tutti in BCC
    var emails = selectedSoci.map(function(s){return s.email;}).filter(Boolean);
    if (!emails.length) { showToast('Nessun socio ha un\'email.','error'); return; }
    var body = sostituisciVariabili(testo, selectedSoci[0]);
    window.location.href = 'mailto:?bcc=' + emails.join(',')
      + '&subject=' + encodeURIComponent(oggetto)
      + '&body='    + encodeURIComponent(body);
    showToast('Email aperta con ' + emails.length + ' destinatari.','success');
    setTimeout(resetForm, 1000);
  }
}

function aggiornaWAPanel() {
  var item = waQueue[waIndex];
  document.getElementById('waCounter').textContent = (waIndex+1) + ' di ' + waQueue.length;
  document.getElementById('waName').textContent    = item.name;
  var btnNext = document.getElementById('btnWANext');
  btnNext.textContent = waIndex>=waQueue.length-1 ? 'Fine' : 'Prossimo destinatario →';
}

function resetForm() {
  goToStep(1);
  document.getElementById('msgTesto').value  = '';
  document.getElementById('msgOggetto').value= '';
  document.getElementById('selectTemplate').value = '';
  document.getElementById('anteprimaBox').textContent = 'Il messaggio apparirà qui…';
  document.getElementById('waPanelStep').classList.remove('visible');
  waQueue=[]; waIndex=0; selectedSoci=[];
  aggiornaCounterDestinatari();
}

// ── Template ──────────────────────────────────────────────────
function populateTemplateSelect() {
  var sel = document.getElementById('selectTemplate');
  sel.innerHTML = '<option value="">Scrivi messaggio libero...</option>';
  allTemplates.forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = '[' + (t.type==='email'?'Email':'WA') + '] ' + (t.name||'Template');
    sel.appendChild(opt);
  });
}

function renderTemplates() {
  var grid = document.getElementById('templateGrid');
  if (!allTemplates.length) {
    grid.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;padding:20px 0;">Nessun template. Creane uno!</div>';
    return;
  }
  var html = '';
  allTemplates.forEach(function(t) {
    var isEmail  = t.type === 'email';
    var preview  = (t.body||'').substring(0,100) + ((t.body||'').length>100?'…':'');
    html += '<div class="template-card">'
      + '<div class="template-card-header">'
      + '<span class="badge ' + (isEmail?'badge-info':'badge-active') + '">' + (isEmail?'Email':'WhatsApp') + '</span>'
      + '<div class="template-name">' + (t.name||'Template') + '</div>'
      + '</div>'
      + (t.subject?'<div style="font-size:.75rem;color:var(--text-muted);font-weight:600;">Oggetto: '+t.subject+'</div>':'')
      + '<div class="template-preview">' + preview + '</div>'
      + '<div class="template-actions">'
      + '<button class="btn btn-secondary" style="font-size:.74rem;padding:5px 10px;" data-usatpl="' + t.id + '">Usa</button>'
      + '<button class="btn btn-ghost" style="font-size:.74rem;padding:5px 10px;" data-edittpl="' + t.id + '">Modifica</button>'
      + '<button class="btn btn-danger" style="font-size:.74rem;padding:5px 10px;" data-deltpl="' + t.id + '">Elimina</button>'
      + '</div></div>';
  });
  grid.innerHTML = html;

  // Listener
  grid.querySelectorAll('[data-usatpl]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tpl = allTemplates.find(function(t){return t.id===btn.dataset.usatpl;});
      if (!tpl) return;
      document.getElementById('selectTemplate').value = tpl.id;
      document.getElementById('msgTesto').value = tpl.body||'';
      if (tpl.subject) document.getElementById('msgOggetto').value = tpl.subject;
      var isEmail = tpl.type==='email';
      document.querySelector('input[name="tipoMsg"][value="'+(isEmail?'email':'whatsapp')+'"]').checked=true;
      document.getElementById('lblWA').classList.toggle('selected',!isEmail);
      document.getElementById('lblEmail').classList.toggle('selected',isEmail);
      document.getElementById('oggettoWrap').style.display=isEmail?'block':'none';
      aggiornaAnteprima();
      goToStep(1);
      window.scrollTo({top:0,behavior:'smooth'});
      showToast('Template caricato!','info');
    });
  });

  grid.querySelectorAll('[data-edittpl]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tpl = allTemplates.find(function(t){return t.id===btn.dataset.edittpl;});
      if (!tpl) return;
      editingTplId = tpl.id;
      document.getElementById('modalTemplateTitle').textContent = 'Modifica Template';
      document.getElementById('tplNome').value    = tpl.name||'';
      document.getElementById('tplBody').value    = tpl.body||'';
      document.getElementById('tplOggetto').value = tpl.subject||'';
      var isEmail = tpl.type==='email';
      document.querySelector('input[name="tplTipo"][value="'+(isEmail?'email':'whatsapp')+'"]').checked=true;
      document.getElementById('tplLblWA').classList.toggle('selected',!isEmail);
      document.getElementById('tplLblEmail').classList.toggle('selected',isEmail);
      document.getElementById('tplOggettoWrap').style.display=isEmail?'block':'none';
      openModal('modalTemplate');
    });
  });

  grid.querySelectorAll('[data-deltpl]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Eliminare questo template?')) return;
      await deleteDoc(doc(db,'templates',btn.dataset.deltpl));
      showToast('Template eliminato.','info');
      allTemplates = allTemplates.filter(function(t){return t.id!==btn.dataset.deltpl;});
      renderTemplates();
      populateTemplateSelect();
    });
  });
}

async function salvaTemplate() {
  var nome = document.getElementById('tplNome').value.trim();
  var body = document.getElementById('tplBody').value.trim();
  var tipo = document.querySelector('input[name="tplTipo"]:checked').value;
  var sogg = document.getElementById('tplOggetto').value.trim();

  if (!nome||!body) { showToast('Nome e testo sono obbligatori.','error'); return; }

  var dati = { name:nome, type:tipo, body:body };
  if (tipo==='email'&&sogg) dati.subject = sogg;

  try {
    if (editingTplId) {
      await updateDoc(doc(db,'templates',editingTplId), dati);
      var idx = allTemplates.findIndex(function(t){return t.id===editingTplId;});
      if (idx!==-1) allTemplates[idx] = Object.assign({id:editingTplId},dati);
      showToast('Template aggiornato!');
    } else {
      dati.createdAt = serverTimestamp();
      var ref = await addDoc(collection(db,'templates'), dati);
      allTemplates.push(Object.assign({id:ref.id},dati));
      showToast('Template creato!');
    }
    closeModal('modalTemplate');
    renderTemplates();
    populateTemplateSelect();
  } catch(err) {
    showToast('Errore nel salvataggio.','error');
  }
}
