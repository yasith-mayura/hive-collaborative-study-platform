const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized (expects env vars)
// NOTE: In production, use service account JSON or environment variables securely.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // ALWAYS read role from MongoDB — custom claims in Firebase tokens
    // only update after the user refreshes their token (logs out/in).
    // Reading from DB ensures role changes take effect immediately.
    const dbUser = await User.findOne({ firebaseUid: decoded.uid, isActive: true }).lean();

    if (!dbUser) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: dbUser.role,   // always from DB, never stale
      _id: dbUser._id,
    };

    next();
  } catch (err) {
    console.error('Firebase token verification failed', err.message);
    return res.status(403).json({ message: 'Forbidden' });
  }
};

module.exports = authMiddleware;