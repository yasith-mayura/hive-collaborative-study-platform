const express = require('express');
const router = express.Router();
const { verifyToken, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /verify - token is taken from Authorization header
router.post('/verify', authMiddleware, (req, res) => {
  // req.user is already populated by authMiddleware
  return verifyToken(req, res);
});

// POST /logout - token is taken from Authorization header
router.post('/logout', authMiddleware, (req, res) => {
  // req.user.uid is available from authMiddleware
  return logout(req, res);
});

module.exports = router;