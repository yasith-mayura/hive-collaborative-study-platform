const admin = require('../config/firebaseAdmin');

const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split('Bearer ')[1].trim();
};

const verifyFirebaseToken = async (idToken) => {
  if (!idToken) {
    const err = new Error('No token provided');
    err.statusCode = 401;
    throw err;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = extractBearerToken(authHeader);
    const decoded = await verifyFirebaseToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json({ message: err.message || 'Unauthorized' });
  }
};

const verifySocketToken = async (socket) => {
  const tokenFromAuth = socket.handshake?.auth?.token;
  const tokenFromHeader = extractBearerToken(socket.handshake?.headers?.authorization);
  const idToken = tokenFromAuth || tokenFromHeader;

  return verifyFirebaseToken(idToken);
};

module.exports = authMiddleware;
module.exports.verifyFirebaseToken = verifyFirebaseToken;
module.exports.verifySocketToken = verifySocketToken;
