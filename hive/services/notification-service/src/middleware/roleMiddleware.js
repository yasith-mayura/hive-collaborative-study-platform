const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
};

const verifyServiceKey = (req, res, next) => {
  const expectedKey = process.env.SERVICE_SECRET_KEY || 'hive_internal_service_key_2025';
  const serviceKey = req.headers['x-service-key'];
  if (!serviceKey || serviceKey !== expectedKey) {
    return res.status(403).json({ message: 'Forbidden: invalid service key' });
  }
  return next();
};

module.exports = {
  requireRole,
  verifyServiceKey,
};
