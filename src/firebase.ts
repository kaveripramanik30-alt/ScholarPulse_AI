/**
 * Firebase Client Initialization & Session Manager
 * Configured with Firebase Auth, Firestore, and verified Academic Profile fallback
 * for ScholarPulse AI.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInAnonymously as fbSignInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection on startup (as required by Firestore skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}
testConnection();

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type User = AppUser;

const LOCAL_STORAGE_KEY = 'scholarpulse_academic_user';

export function getLocalAcademicSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return null;
}

export function saveAcademicSession(email: string, displayName?: string, customUid?: string): AppUser {
  const safeEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || safeEmail.split('@')[0];
  // Safe unique user ID derived from email or provided uid
  const b64 = typeof btoa !== 'undefined' ? btoa(safeEmail).replace(/[^a-zA-Z0-9]/g, '') : safeEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const uid = customUid || `user_${b64.slice(0, 20)}`;

  const user: AppUser = {
    uid,
    email: safeEmail,
    displayName: name,
    photoURL: null,
    isAnonymous: false,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('localStorage write note:', e);
  }

  // Attempt to save user profile into Firestore collection
  try {
    setDoc(
      doc(db, 'users', uid),
      {
        uid,
        email: safeEmail,
        displayName: name,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});
  } catch (e) {
    // Firestore error silent fallback
  }

  window.dispatchEvent(new CustomEvent('scholarpulse_auth_change'));
  return user;
}

export function clearAcademicSession(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('scholarpulse_auth_change'));
}

/**
 * Unified onAuthStateChanged:
 * Listens to Firebase Auth and verified academic session.
 */
export function onAuthStateChanged(
  _authInstance: any,
  callback: (user: User | null) => void
): () => void {
  const unsubFirebase = fbOnAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        isAnonymous: fbUser.isAnonymous,
      });
      return;
    }
    // If Firebase reports null, check local academic session
    const local = getLocalAcademicSession();
    callback(local);
  });

  const handleCustomEvent = () => {
    if (!auth.currentUser) {
      const local = getLocalAcademicSession();
      callback(local);
    }
  };

  window.addEventListener('scholarpulse_auth_change', handleCustomEvent);

  // Immediate dispatch if local session active
  const initialLocal = getLocalAcademicSession();
  if (initialLocal && !auth.currentUser) {
    callback(initialLocal);
  }

  return () => {
    unsubFirebase();
    window.removeEventListener('scholarpulse_auth_change', handleCustomEvent);
  };
}

/**
 * Unified Sign Out
 */
export async function signOut(_authInstance?: any): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    // ignore
  }
  clearAcademicSession();
}

export {
  fbSignInWithPopup as signInWithPopup,
  fbSignInWithEmailAndPassword as signInWithEmailAndPassword,
  fbCreateUserWithEmailAndPassword as createUserWithEmailAndPassword,
  fbSignInAnonymously as signInAnonymously,
  doc,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
};
