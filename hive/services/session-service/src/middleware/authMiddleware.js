require('dotenv').config();
const admin = require('firebase-admin');

const USER_SERVICE_CANDIDATES = [
  process.env.USER_SERVICE_URL,
  'http://user-service:3001',
  'http://localhost:3001',
].filter(Boolean);

const fetchUserProfile = async (idToken) => {
  let lastError = null;

  for (const baseUrl of USER_SERVICE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        lastError = new Error(`Failed to load user profile from ${baseUrl}: ${response.status}`);
        continue;
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to load user profile');
};

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

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Resolve role/batch from user-service DB to avoid stale token claims.
    const profile = await fetchUserProfile(idToken);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || profile?.email || null,
      role: profile?.role || decoded.role || null,
      batch: profile?.batch ?? null,
      studentNumber: profile?.studentNumber ?? null,
    };

    if (!req.user.role) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  } catch (err) {
    console.error('Firebase token verification failed', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
