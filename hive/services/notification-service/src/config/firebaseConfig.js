const admin = require('firebase-admin');

let firebaseReady = false;

const initFirebaseAdmin = () => {
  if (firebaseReady || admin.apps.length) {
    firebaseReady = true;
    return admin;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase env vars missing: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  firebaseReady = true;
  return admin;
};

module.exports = {
  admin,
  initFirebaseAdmin,
};
