/**
 * requireRole(...roles)
 * Middleware factory — only allows users whose role is in the allowed list.
 * Must come AFTER authMiddleware (requires req.user to be set).
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: no role found on request' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
