const { admin, initFirebaseAdmin } = require('../config/firebaseConfig');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: decoded.role || decoded.customClaims?.role || null,
    };
    return next();
  } catch (err) {
    console.error('verifyToken error', err.message || err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = {
  verifyToken,
};
