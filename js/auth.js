// ============================================================
// js/auth.js — Controllo accessi
// ============================================================

import { auth, db, doc, getDoc, onAuthStateChanged } from './firebase.js';

/**
 * checkAuth(requiredRole)
 * Chiama questa funzione in cima a ogni pagina protetta.
 *
 * requiredRole: 'admin' | 'corsista' | null (null = qualsiasi ruolo autenticato)
 *
 * Comportamento:
 *  - Non loggato          → redirect a index.html
 *  - Corsista su pag admin→ redirect a calendario-corsista.html
 *  - Tutto ok             → rimuove class 'hidden' dal body e restituisce il doc utente
 */
export async function checkAuth(requiredRole = null) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Non autenticato → vai al login
        window.location.href = '/index.html';
        return;
      }

      try {
        const userRef  = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Utente Firebase Auth esiste ma non ha doc in Firestore
          await auth.signOut();
          window.location.href = '/index.html';
          return;
        }

        const userData = { id: user.uid, ...userSnap.data() };

        // Controllo ruolo
        if (requiredRole === 'admin' && userData.role !== 'admin') {
          // Un corsista cerca di accedere a una pagina admin
          window.location.href = '/calendario-corsista.html';
          return;
        }

        if (requiredRole === 'corsista' && userData.role !== 'corsista') {
          // Un admin sulla pagina corsista: reindirizza alla dashboard
          window.location.href = '/dashboard.html';
          return;
        }

        // ✅ Tutto ok — mostra la pagina
        document.body.classList.remove('hidden');
        resolve(userData);

      } catch (err) {
        console.error('Errore checkAuth:', err);
        window.location.href = '/index.html';
      }
    });
  });
}

/**
 * getCurrentUser()
 * Restituisce i dati Firestore dell'utente corrente (o null).
 */
export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'users', user.uid));
  return snap.exists() ? { id: user.uid, ...snap.data() } : null;
}
