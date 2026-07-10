// Inicialização opcional do Firebase/Firestore.
// As credenciais vêm de variáveis de ambiente (arquivo .env, prefixo VITE_).
// Sem configuração, a aplicação opera 100% em localStorage (modo offline).
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseHabilitado = Boolean(cfg.apiKey && cfg.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function initFirebase(): { db: Firestore; auth: Auth } | null {
  if (!firebaseHabilitado) return null;
  if (!app) {
    app = initializeApp(cfg as Record<string, string>);
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { db: db!, auth: auth! };
}

// Autenticação anônima (usada pela sincronização em tempo real).
export async function autenticarAnonimo(): Promise<boolean> {
  const fb = initFirebase();
  if (!fb) return false;
  try {
    await signInAnonymously(fb.auth);
    return true;
  } catch {
    return false;
  }
}
