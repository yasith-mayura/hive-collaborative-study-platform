const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateCreateUser, validateCreateAdmin } = require('../middleware/validateMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
} = require('../controllers/userController');

// GET /users - admin or superadmin
router.get('/users', authMiddleware, requireRole('admin', 'superadmin'), getAllUsers);

// GET /users/:id - admin, superadmin or own profile
router.get('/users/:id', authMiddleware, getUserById);

// POST /users - admin or superadmin
router.post('/users', authMiddleware, requireRole('admin', 'superadmin'), validateCreateUser, createUser);

// DELETE /users/:id - admin or superadmin
router.delete('/users/:id', authMiddleware, requireRole('admin', 'superadmin'), deleteUser);

// GET /admins - superadmin only
router.get('/admins', authMiddleware, requireRole('superadmin'), getAllAdmins);

// POST /admins - superadmin only
router.post('/admins', authMiddleware, requireRole('superadmin'), validateCreateAdmin, createAdmin);

// DELETE /admins/:id - superadmin only
router.delete('/admins/:id', authMiddleware, requireRole('superadmin'), deleteAdmin);

module.exports = router;
