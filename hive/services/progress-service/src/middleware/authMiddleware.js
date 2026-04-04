const admin = require('firebase-admin');
const User = require('../models/User');

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'superadmin') return role;
  return 'student';
};

const ensureDbUser = async (decoded) => {
  let dbUser = await User.findOne({ firebaseUid: decoded.uid, isActive: true }).lean();
  if (dbUser) return dbUser;

  const firebaseUser = await admin.auth().getUser(decoded.uid);
  const email = decoded.email || firebaseUser.email;

  if (!email) {
    throw new Error('Cannot auto-provision user without email');
  }

  const created = await User.create({
    firebaseUid: decoded.uid,
    email,
    name: decoded.name || firebaseUser.displayName || email.split('@')[0],
    role: normalizeRole(decoded.role || decoded.customClaims?.role),
    isActive: true,
  });

  return created.toObject();
};

const initFirebaseAdmin = () => {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase service account environment variables');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);

    const dbUser = await ensureDbUser(decoded);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: dbUser.role,
      studentNumber: dbUser.studentNumber || null,
      name: dbUser.name || null,
      batch: dbUser.batch || null,
    };

    next();
  } catch (err) {
    console.error('Firebase auth failed', err.message);
    return res.status(403).json({ message: 'Forbidden' });
  }
};

module.exports = authMiddleware;
