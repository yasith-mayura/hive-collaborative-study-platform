import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cleanEnvValue = (value) =>
  typeof value === "string"
    ? value.trim().replace(/^['\"]|['\"]$/g, "").replace(/,$/, "")
    : value;

const firebaseConfig = {
  apiKey: cleanEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    "Missing Firebase config: set VITE_FIREBASE_API_KEY in frontend/.env"
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;