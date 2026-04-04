const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Lazy-initialize Firebase so invalid/missing env vars don't crash at startup
let firebaseReady = false;

const ensureFirebase = () => {
  if (firebaseReady || admin.apps.length) { firebaseReady = true; return; }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    console.warn('Firebase environment variables are not fully configured.');
    throw new Error('Firebase env vars missing: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  }

  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  firebaseReady = true;
};

// Export a proxy that ensures Firebase is initialized before use
const lazyAdmin = new Proxy(admin, {
  get(target, prop) {
    if (prop === 'auth' || prop === 'firestore' || prop === 'messaging') {
      ensureFirebase();
    }
    return target[prop];
  },
});

module.exports = lazyAdmin;
