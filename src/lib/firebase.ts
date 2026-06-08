import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeAuth com AsyncStorage persiste o login entre sessões no React Native.
// getReactNativePersistence está no bundle RN de @firebase/auth; o tipo é declarado
// em src/types/firebase-auth-rn.d.ts para compensar a ausência nos tipos browser.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// memoryLocalCache elimina a race condition onde persistentLocalCache restauraria
// listeners do SQLite antes do token de auth ser recuperado do AsyncStorage.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});
