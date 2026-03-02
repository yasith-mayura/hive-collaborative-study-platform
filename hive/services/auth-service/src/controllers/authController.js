const admin = require('../config/firebaseConfig');

// Verify token controller
const verifyToken = async (req, res) => {
  //const { token } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) return res.status(400).json({ message: 'Token is required' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const role = decoded.role || (decoded.customClaims && decoded.customClaims.role) || 'student';

    return res.json({ uid: decoded.uid, email: decoded.email || null, role });
  } catch (err) {
    console.error('Token verification failed', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const logout = async (req, res) => {
  // Use uid from authMiddleware
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ message: 'No authenticated user' });
  }

  try {
    await admin.auth().revokeRefreshTokens(req.user.uid);
    return res.json({ message: 'User logged out (refresh tokens revoked)', uid: req.user.uid });
  } catch (err) {
    console.error('Failed to revoke tokens', err);
    return res.status(500).json({ message: 'Failed to revoke tokens' });
  }
};

module.exports = { verifyToken, logout };
