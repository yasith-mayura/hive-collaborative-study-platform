const admin = require('firebase-admin');

// Lazy-initialize Firebase so invalid/missing env vars don't crash at startup
let firebaseReady = false;
const ensureFirebase = () => {
  if (firebaseReady || admin.apps.length) { firebaseReady = true; return; }

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
};

const User = require('../models/User');

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'superadmin') return role;
  return 'student';
};

const resolveTokenRole = (decoded) => {
  return normalizeRole(decoded?.role || decoded?.customClaims?.role);
};

const deriveFallbackName = (decoded, firebaseUser) => {
  return (
    decoded?.name ||
    firebaseUser?.displayName ||
    (decoded?.email || firebaseUser?.email || 'user').split('@')[0]
  );
};

const ensureDbUser = async (decoded) => {
  let dbUser = await User.findOne({ firebaseUid: decoded.uid, isActive: true }).lean();
  if (dbUser) return dbUser;

  // After local DB resets, existing Firebase users can still authenticate.
  // Recreate a minimal profile so protected routes don't fail with 401.
  const firebaseUser = await admin.auth().getUser(decoded.uid);
  const role = resolveTokenRole(decoded);
  const email = decoded.email || firebaseUser.email;

  if (!email) {
    throw new Error('Cannot auto-provision user without email');
  }

  const created = await User.create({
    firebaseUid: decoded.uid,
    email,
    name: deriveFallbackName(decoded, firebaseUser),
    role,
    isActive: true,
  });

  return created.toObject();
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    ensureFirebase();
    const decoded = await admin.auth().verifyIdToken(idToken);

    // ALWAYS read role from MongoDB — custom claims in Firebase tokens
    // only update after the user refreshes their token (logs out/in).
    // Reading from DB ensures role changes take effect immediately.
    const dbUser = await ensureDbUser(decoded);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: dbUser.role,   // always from DB, never stale
      _id: dbUser._id,
      batch: dbUser.batch ?? null,
      studentNumber: dbUser.studentNumber ?? null,
    };

    next();
  } catch (err) {
    console.error('Firebase token verification failed', err.message);
    return res.status(403).json({ message: 'Forbidden' });
  }
};

module.exports = authMiddleware;