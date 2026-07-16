import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is fully configured
const isConfigured = !!(
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('your_') &&
  firebaseConfig.authDomain && 
  !firebaseConfig.authDomain.includes('your_')
);

let app;
let auth = null;
let storage = null;
let db = null;
let analytics = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      const { getAnalytics } = require('firebase/analytics');
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn("Firebase config is missing or using placeholder values. App is running in Mock Mode.");
  }
}

export { app, auth, storage, db, analytics, isConfigured };
