// ============================================================
// js/firebase.js — Configurazione Firebase
// ============================================================
// ⚠️  PRIMA DI USARE QUESTO FILE:
//     Vai su console.firebase.google.com → il tuo progetto →
//     Impostazioni progetto → Aggiungi app Web → copia le credenziali
//     e incollale qui sotto al posto dei valori "INSERISCI_QUI_..."
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ────────────────────────────────────────────────────────────
// 🔑  INCOLLA QUI LE TUE CREDENZIALI FIREBASE
// ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCIYt0tgl0MQbG3KAkpqTg_ZZMykT0w8lw",
  authDomain:        "gestionale-palestra-44dba.firebaseapp.com",
  projectId:         "gestionale-palestra-44dba",
  storageBucket:     "gestionale-palestra-44dba.firebasestorage.app",
  messagingSenderId: "127344006319",
  appId:             "1:127344006319:web:a478ba76a586e8c1b7705a"
};
// ────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

export {
  db, auth,
  collection, doc, getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy,
  onSnapshot, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};
