import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import type { DocketTemplateData, ExportJobRecord, UserProfile } from '../types/docket';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if present
let firestoreDb: Firestore;
try {
  if (firebaseConfigRaw.firestoreDatabaseId && firebaseConfigRaw.firestoreDatabaseId !== '(default)') {
    firestoreDb = getFirestore(app, firebaseConfigRaw.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (e) {
  console.warn('Fallback to default firestore database', e);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Sign-in with Google
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (err: any) {
    console.error('Google sign-in popup failed, attempting anonymous sign-in:', err);
    // If popup blocked or failed, allow guest sign-in for seamless experience
    const anonResult = await signInAnonymously(auth);
    await syncUserProfile(anonResult.user);
    return anonResult.user;
  }
}

// Sign-in as Guest
export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  await syncUserProfile(result.user);
  return result.user;
}

// Sign Out
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Sync user profile in Firestore
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    const newProfile: UserProfile = {
      id: user.uid,
      email: user.email || `guest_${user.uid.substring(0, 6)}@docketforge.local`,
      displayName: user.displayName || (user.isAnonymous ? 'Guest Printer' : 'Print Master'),
      photoURL: user.photoURL || '',
      tier: 'PRO',
      credits: 50, // Starting bonus credits
    };
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newProfile;
  } else {
    const data = snap.data() as UserProfile;
    return {
      id: user.uid,
      email: data.email || user.email || '',
      displayName: data.displayName || user.displayName || 'Printer User',
      photoURL: data.photoURL || user.photoURL || '',
      tier: data.tier || 'PRO',
      credits: typeof data.credits === 'number' ? data.credits : 50,
    };
  }
}

// Deduct credits on export
export async function deductCredit(userId: string, amount: number = 1): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return 50;
  const currentCredits = snap.data()?.credits ?? 50;
  const nextCredits = Math.max(0, currentCredits - amount);
  await setDoc(userRef, { credits: nextCredits, updatedAt: serverTimestamp() }, { merge: true });
  return nextCredits;
}

// Save Docket Template
export async function saveTemplateToFirestore(userId: string, template: DocketTemplateData): Promise<string> {
  const templateId = template.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const templateRef = doc(db, 'users', userId, 'templates', templateId);
  
  const payload = {
    ...template,
    id: templateId,
    updatedAt: serverTimestamp(),
    createdAt: template.id ? undefined : serverTimestamp(),
  };

  await setDoc(templateRef, payload, { merge: true });
  return templateId;
}

// Fetch all templates for a user
export async function fetchUserTemplates(userId: string): Promise<DocketTemplateData[]> {
  try {
    const colRef = collection(db, 'users', userId, 'templates');
    const q = query(colRef);
    const snap = await getDocs(q);
    const templates: DocketTemplateData[] = [];
    snap.forEach((d) => {
      templates.push(d.data() as DocketTemplateData);
    });
    return templates;
  } catch (e) {
    console.error('Failed to fetch user templates:', e);
    return [];
  }
}

// Delete template
export async function deleteTemplateFromFirestore(userId: string, templateId: string): Promise<void> {
  const templateRef = doc(db, 'users', userId, 'templates', templateId);
  await deleteDoc(templateRef);
}

// Record an export job
export async function logExportJob(userId: string, job: Omit<ExportJobRecord, 'id' | 'createdAt'>): Promise<void> {
  try {
    const jobId = `job_${Date.now()}`;
    const jobRef = doc(db, 'users', userId, 'exports', jobId);
    await setDoc(jobRef, {
      ...job,
      id: jobId,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to log export job:', e);
  }
}

// Fetch export job history
export async function fetchExportHistory(userId: string): Promise<ExportJobRecord[]> {
  try {
    const colRef = collection(db, 'users', userId, 'exports');
    const snap = await getDocs(colRef);
    const jobs: ExportJobRecord[] = [];
    snap.forEach((d) => {
      jobs.push(d.data() as ExportJobRecord);
    });
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('Failed to fetch export history:', e);
    return [];
  }
}
