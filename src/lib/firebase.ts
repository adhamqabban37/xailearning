import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Runtime validation to diagnose missing env vars
const missing = Object.entries(firebaseConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(
    "[Firebase] CRITICAL: Missing environment variables:",
    missing.join(", "),
    "\nCheck your .env.local file and restart the dev server."
  );
  throw new Error(`Firebase config incomplete: ${missing.join(", ")}`);
}

// Prevent accidental emulator usage in production
const isProduction = process.env.NODE_ENV === "production";
const hasEmulatorVars =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (isProduction && hasEmulatorVars) {
  console.error(
    "[Firebase] CRITICAL: Emulator environment variables detected in production build!",
    "FIRESTORE_EMULATOR_HOST:",
    process.env.FIRESTORE_EMULATOR_HOST,
    "FIREBASE_AUTH_EMULATOR_HOST:",
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  );
  throw new Error(
    "Firebase emulator settings detected in production. Remove emulator env vars before deploying."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence with comprehensive error handling
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("[Firebase] ✓ Offline persistence enabled successfully");
    })
    .catch((err) => {
      const code = err?.code;
      if (code === "failed-precondition") {
        // Multiple tabs open - only one tab can enable persistence at a time
        console.warn(
          "[Firebase] Offline persistence failed: Multiple tabs open.",
          "Only the first tab has persistence enabled.",
          "Close other tabs or refresh this page if you need offline access."
        );
      } else if (code === "unimplemented") {
        // Browser doesn't support persistence (e.g., private/incognito mode)
        console.warn(
          "[Firebase] Offline persistence not available in this browser.",
          "You may be in private/incognito mode or using an unsupported browser.",
          "The app will still work but requires an active internet connection."
        );
      } else {
        console.error("[Firebase] Unexpected persistence error:", code, err);
      }
    });
}

export default app;
