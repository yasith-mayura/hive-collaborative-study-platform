const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateAdmin,
  validateUpdateMyProfile,
} = require('../middleware/validateMiddleware');
const {
  getAllUsers,
  getAllStudents,
  getUserById,
  getMyProfile,
  createUser,
  updateMyProfile,
  updateUser,
  deleteUser,
  getAllAdmins,
  promoteUserToAdmin,
  demoteAdminToUser,
  updateAdmin,
  deleteAdmin,
} = require('../controllers/userController');

// GET /users - admin or superadmin
router.get('/users', authMiddleware, requireRole('admin', 'superadmin'), getAllUsers);

// GET /students - admin or superadmin (students only, for promoting to admin)
router.get('/students', authMiddleware, requireRole('admin', 'superadmin'), getAllStudents);

// GET /users/me - authenticated user's own profile
router.get('/users/me', authMiddleware, getMyProfile);

// GET /users/:studentNumber - admin, superadmin or own profile
router.get('/users/:studentNumber', authMiddleware, getUserById);

// POST /users/register - public student self-registration
router.post('/users/register', validateCreateUser, createUser);

// POST /users - admin or superadmin
router.post('/users', authMiddleware, requireRole('admin', 'superadmin'), (req, res) => {
  return res.status(403).json({ message: 'Creating new users is disabled' });
});

// PUT /users/me - authenticated user's own profile (name/password only)
router.put('/users/me', authMiddleware, validateUpdateMyProfile, updateMyProfile);

// PUT /users/:studentNumber - admin or superadmin
router.put('/users/:studentNumber', authMiddleware, requireRole('admin', 'superadmin'), validateUpdateUser, updateUser);

// DELETE /users/:studentNumber - admin or superadmin
router.delete('/users/:studentNumber', authMiddleware, requireRole('admin', 'superadmin'), deleteUser);

// GET /admins - superadmin only
router.get('/admins', authMiddleware, requireRole('superadmin'), getAllAdmins);

// POST /admins - superadmin only
router.post('/admins', authMiddleware, requireRole('superadmin'), (req, res) => {
  return res.status(403).json({ message: 'Creating new admins is disabled' });
});

// POST /admins/promote/:studentNumber - promote user to admin (superadmin only)
router.post('/admins/promote/:studentNumber', authMiddleware, requireRole('superadmin'), promoteUserToAdmin);

// POST /admins/demote/:studentNumber - demote admin to user (superadmin only)
router.post('/admins/demote/:studentNumber', authMiddleware, requireRole('superadmin'), demoteAdminToUser);

// PUT /admins/:studentNumber - superadmin only
router.put('/admins/:studentNumber', authMiddleware, requireRole('superadmin'), validateUpdateAdmin, updateAdmin);

// DELETE /admins/:studentNumber - superadmin only
router.delete('/admins/:studentNumber', authMiddleware, requireRole('superadmin'), deleteAdmin);

module.exports = router;
