const User = require('../models/User');
const admin = require('firebase-admin');

const STUDENT_NUMBER_PATTERN = /^SE\/(\d{4})\/\d{3}$/;

const parseBatchFromStudentNumber = (studentNumber) => {
  const match = String(studentNumber || '').match(STUDENT_NUMBER_PATTERN);
  return match ? parseInt(match[1], 10) : null;
};

const isAdmin = (req) => req.user?.role === 'admin';

const syncFirebaseSafely = async (firebaseUid, operation, label) => {
  if (!firebaseUid) return null;

  try {
    await operation(firebaseUid);
    return null;
  } catch (err) {
    console.error(`${label} firebase sync error`, err.message || err);
    return 'User data updated in database, but Firebase sync failed';
  }
};

// GET all users (admin or superadmin)
const getAllUsers = async (req, res) => {
  try {
    const query = { isActive: true };
    if (isAdmin(req)) {
      query.batch = req.user.batch;
    }

    const users = await User.find(query).select('-password');
    return res.json(users);
  } catch (err) {
    console.error('getAllUsers error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET all students only (for promoting to admin)
const getAllStudents = async (req, res) => {
  try {
    const query = { role: 'student', isActive: true };
    if (isAdmin(req)) {
      query.batch = req.user.batch;
    }

    const students = await User.find(query).select('-password');
    return res.json(students);
  } catch (err) {
    console.error('getAllStudents error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET user by id
const getUserById = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const user = await User.findOne({ studentNumber }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Allow superadmin, own profile, or admin from same batch.
    if (
      req.user.role !== 'superadmin' &&
      req.user.uid !== user.firebaseUid
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (
      req.user.role === 'admin' &&
      req.user.uid !== user.firebaseUid &&
      user.batch !== req.user.batch
    ) {
      return res.status(403).json({ message: 'Forbidden: different batch' });
    }

    return res.json(user);
  } catch (err) {
    console.error('getUserById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET authenticated user's own profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid, isActive: true }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error('getMyProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT authenticated user's own profile (name/password only)
const updateMyProfile = async (req, res) => {
  try {
    const { name, password, email, studentNumber } = req.body;

    if (email !== undefined || studentNumber !== undefined) {
      return res.status(400).json({
        message: 'Email and student number cannot be changed from profile settings',
      });
    }

    if (!name && !password) {
      return res.status(400).json({ message: 'Provide at least one field to update' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) {
      user.name = name;
      await user.save();
    }

    const firebaseWarning = await syncFirebaseSafely(
      user.firebaseUid,
      async (uid) => {
        const firebasePatch = {};
        if (name) firebasePatch.displayName = name;
        if (password) firebasePatch.password = password;

        if (Object.keys(firebasePatch).length > 0) {
          await admin.auth().updateUser(uid, firebasePatch);
        }
      },
      'updateMyProfile'
    );

    const updatedUser = await User.findById(user._id).select('-password');

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      warning: firebaseWarning,
    });
  } catch (err) {
    console.error('updateMyProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// POST /users - create new user 
const createUser = async (req, res) => {
  try {
    const { name, email, password, studentNumber } = req.body;

    // Basic validation
    if (!name || !email || !password || !studentNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isAdmin(req)) {
      const newUserBatch = parseBatchFromStudentNumber(studentNumber);
      if (newUserBatch === null) {
        return res.status(400).json({ message: "Invalid student number format" });
      }

      if (newUserBatch !== req.user.batch) {
        return res.status(403).json({ message: "Forbidden: can only create users in your batch" });
      }
    }

    // Always assign student role (DO NOT TRUST FRONTEND)
    const assignedRole = "student";

    // Create Firebase Authentication user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Set custom claim role = student
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: assignedRole,
    });

    // Save user in MongoDB
    const user = new User({
      name,
      email,
      studentNumber,
      role: assignedRole,
      firebaseUid: firebaseUser.uid,
    });

    await user.save();

    // Return safe response (never send password)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentNumber: user.studentNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("registerUser error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field",
        error: err.keyValue,
      });
    }

    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE soft delete user
const deleteUser = async (req, res) => {
  try {
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;

    // Find user first
    const userQuery = { studentNumber, role: "student" };
    if (isAdmin(req)) {
      userQuery.batch = req.user.batch;
    }

    const user = await User.findOne(userQuery);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete in MongoDB
    user.isActive = false;
    await user.save();

    // Disable Firebase account
    const firebaseWarning = await syncFirebaseSafely(
      user.firebaseUid,
      async (uid) => {
        await admin.auth().updateUser(uid, {
          disabled: true,
        });
        await admin.auth().revokeRefreshTokens(uid);
      },
      'deleteUser'
    );

    return res.json({
      message: "User deactivated successfully",
      studentNumber: user.studentNumber,
      warning: firebaseWarning,
    });

  } catch (err) {
    console.error("deleteUser error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT update user (admin or superadmin)
const updateUser = async (req, res) => {
  try {
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;
    const { name, email, studentNumber: nextStudentNumber } = req.body;

    const userQuery = { studentNumber, role: "student", isActive: true };
    if (isAdmin(req)) {
      userQuery.batch = req.user.batch;
    }

    const user = await User.findOne(userQuery);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: user._id } }).lean();
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    if (nextStudentNumber && nextStudentNumber !== user.studentNumber) {
      if (isAdmin(req)) {
        const nextBatch = parseBatchFromStudentNumber(nextStudentNumber);
        if (nextBatch === null) {
          return res.status(400).json({ message: "Invalid student number format" });
        }
        if (nextBatch !== req.user.batch) {
          return res.status(403).json({ message: "Forbidden: cannot move user to a different batch" });
        }
      }

      const duplicateStudentNumber = await User.findOne({
        studentNumber: nextStudentNumber,
        _id: { $ne: user._id },
      }).lean();
      if (duplicateStudentNumber) {
        return res.status(400).json({ message: "Student number already exists" });
      }
      user.studentNumber = nextStudentNumber;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    const firebasePatch = {};
    if (name) firebasePatch.displayName = user.name;
    if (email) firebasePatch.email = user.email;

    const firebaseWarning =
      Object.keys(firebasePatch).length > 0
        ? await syncFirebaseSafely(
            user.firebaseUid,
            async (uid) => {
              await admin.auth().updateUser(uid, firebasePatch);
            },
            'updateUser'
          )
        : null;

    return res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentNumber: user.studentNumber,
        role: user.role,
        batch: user.batch,
      },
      warning: firebaseWarning,
    });
  } catch (err) {
    console.error("updateUser error", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// GET all admins (superadmin only)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('-password');
    return res.json(admins);
  } catch (err) {
    console.error('getAllAdmins error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST create new admin (superadmin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, studentNumber } = req.body;

    const firebaseUser = await admin.auth().createUser({
      email,
      password: password || Math.random().toString(36).slice(-8),
      displayName: name,
    });

    await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'admin' });

    const user = new User({
      name,
      email,
      password: password,
      studentNumber: studentNumber,
      role: 'admin',
      firebaseUid: firebaseUser.uid,
    });

    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    console.error('createAdmin error', err);

    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate field', error: err.keyValue });
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST promote existing user to admin (superadmin only)
const promoteUserToAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;

    // Find the user (must be a student, must be active)
    const user = await User.findOne({ studentNumber, role: "student", isActive: true });

    if (!user) {
      return res.status(404).json({ message: "User not found or is not a student" });
    }

    // Convert role to admin
    user.role = "admin";
    await user.save();

    // Update Firebase custom claims to admin
    const firebaseWarning = await syncFirebaseSafely(
      user.firebaseUid,
      async (uid) => {
        await admin.auth().setCustomUserClaims(uid, { role: "admin" });
      },
      "promoteUserToAdmin"
    );

    return res.json({
      message: "User promoted to admin successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentNumber: user.studentNumber,
        role: user.role,
      },
      warning: firebaseWarning,
    });
  } catch (err) {
    console.error("promoteUserToAdmin error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE soft delete admin (superadmin only)
const deleteAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;

    const adminUser = await User.findOne({ studentNumber, role: "admin" });

    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Soft delete in MongoDB
    adminUser.isActive = false;
    await adminUser.save();

    // Disable Firebase account
    const firebaseWarning = await syncFirebaseSafely(
      adminUser.firebaseUid,
      async (uid) => {
        await admin.auth().updateUser(uid, {
          disabled: true,
        });
        await admin.auth().revokeRefreshTokens(uid);
      },
      'deleteAdmin'
    );

    return res.json({
      message: "Admin deactivated successfully",
      studentNumber: adminUser.studentNumber,
      warning: firebaseWarning,
    });

  } catch (err) {
    console.error("deleteAdmin error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT update admin (superadmin only)
const updateAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;
    const { name, email, studentNumber: nextStudentNumber } = req.body;

    const adminUser = await User.findOne({ studentNumber, role: "admin", isActive: true });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (email && email !== adminUser.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: adminUser._id } }).lean();
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      adminUser.email = email;
    }

    if (nextStudentNumber && nextStudentNumber !== adminUser.studentNumber) {
      const duplicateStudentNumber = await User.findOne({
        studentNumber: nextStudentNumber,
        _id: { $ne: adminUser._id },
      }).lean();
      if (duplicateStudentNumber) {
        return res.status(400).json({ message: "Student number already exists" });
      }
      adminUser.studentNumber = nextStudentNumber;
    }

    if (name) {
      adminUser.name = name;
    }

    await adminUser.save();

    const firebasePatch = {};
    if (name) firebasePatch.displayName = adminUser.name;
    if (email) firebasePatch.email = adminUser.email;

    const firebaseWarning =
      Object.keys(firebasePatch).length > 0
        ? await syncFirebaseSafely(
            adminUser.firebaseUid,
            async (uid) => {
              await admin.auth().updateUser(uid, firebasePatch);
            },
            'updateAdmin'
          )
        : null;

    return res.json({
      message: "Admin updated successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        studentNumber: adminUser.studentNumber,
        role: adminUser.role,
        batch: adminUser.batch,
      },
      warning: firebaseWarning,
    });
  } catch (err) {
    console.error("updateAdmin error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getAllStudents,
  getUserById,
  getMyProfile,
  createUser,
  updateMyProfile,
  updateUser,
  deleteUser,
  getAllAdmins,
  createAdmin,
  promoteUserToAdmin,
  updateAdmin,
  deleteAdmin,
};


