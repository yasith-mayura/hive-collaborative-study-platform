const BatchLevel = require('../models/BatchLevel');
const User = require('../models/User');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'hive_internal_service_key_2025';

const normalizeBatch = (batch = '') => String(batch).trim();

const sendNotificationSafely = async (payload) => {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SERVICE_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('sendNotificationSafely failed', response.status, body);
    }
  } catch (err) {
    console.error('sendNotificationSafely error', err.message || err);
  }
};

const getBatchLevels = async (req, res) => {
  try {
    const assignments = await BatchLevel.find({})
      .sort({ level: 1 })
      .select('batch level assignedAt assignedBy')
      .lean();

    return res.json(assignments);
  } catch (err) {
    console.error('getBatchLevels error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getDistinctBatches = async (req, res) => {
  try {
    const batches = await User.distinct('batch', {
      isActive: true,
      batch: { $exists: true, $ne: null },
    });

    const normalized = batches
      .map((batch) => normalizeBatch(batch))
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));

    return res.json(normalized);
  } catch (err) {
    console.error('getDistinctBatches error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyAssignedLevel = async (req, res) => {
  try {
    const role = req.user?.role;

    // Superadmin can access all levels.
    if (role === 'superadmin') {
      return res.json({
        hasRestriction: false,
        batch: req.user?.batch ?? null,
        level: null,
      });
    }

    const userBatch = normalizeBatch(req.user?.batch);
    if (!userBatch) {
      return res.status(404).json({
        message: 'No batch found for current user',
      });
    }

    const assignment = await BatchLevel.findOne({ batch: userBatch })
      .select('batch level')
      .lean();

    if (!assignment) {
      return res.status(404).json({
        message: `No level assignment found for batch ${userBatch}`,
      });
    }

    return res.json({
      hasRestriction: true,
      batch: assignment.batch,
      level: assignment.level,
    });
  } catch (err) {
    console.error('getMyAssignedLevel error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const assignBatchLevel = async (req, res) => {
  try {
    const batch = normalizeBatch(req.body.batch);
    const level = Number(req.body.level);
    const confirmReplace = Boolean(req.body.confirmReplace);

    if (!batch || !Number.isInteger(level) || level < 1 || level > 4) {
      return res.status(400).json({ message: 'batch and level (1-4) are required' });
    }

    const [existingByBatch, existingByLevel] = await Promise.all([
      BatchLevel.findOne({ batch }),
      BatchLevel.findOne({ level }),
    ]);

    const conflicts = [];

    if (existingByBatch && existingByBatch.level !== level) {
      conflicts.push({
        type: 'batch-assigned-elsewhere',
        batch,
        currentLevel: existingByBatch.level,
        requestedLevel: level,
        message: `Batch ${batch} is currently assigned to Level ${existingByBatch.level}. Assigning it to Level ${level} will remove it from Level ${existingByBatch.level}. Are you sure?`,
      });
    }

    if (existingByLevel && existingByLevel.batch !== batch) {
      conflicts.push({
        type: 'level-assigned-elsewhere',
        level,
        currentBatch: existingByLevel.batch,
        requestedBatch: batch,
        message: `Level ${level} is currently assigned to Batch ${existingByLevel.batch}. This will replace Batch ${existingByLevel.batch} with Batch ${batch}. Are you sure?`,
      });
    }

    if (conflicts.length > 0 && !confirmReplace) {
      return res.status(409).json({
        message: 'Assignment conflict',
        requiresConfirmation: true,
        conflicts,
      });
    }

    if (confirmReplace) {
      await Promise.all([
        BatchLevel.deleteMany({
          $or: [
            { batch, level: { $ne: level } },
            { level, batch: { $ne: batch } },
          ],
        }),
      ]);
    }

    const assignment = await BatchLevel.findOneAndUpdate(
      { batch },
      {
        $set: {
          level,
          assignedBy: req.user.uid,
          assignedAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await sendNotificationSafely({
      userIds: `batch:${batch}`,
      title: 'Batch Level Assigned',
      message: `Your batch has been assigned to Level ${level}. New courses are now available.`,
      type: 'batch',
      data: {
        batch,
        level,
      },
    });

    return res.status(200).json({
      message: `Batch ${batch} assigned to Level ${level} successfully`,
      assignment,
    });
  } catch (err) {
    console.error('assignBatchLevel error', err);
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Assignment conflict',
        requiresConfirmation: true,
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

const removeBatchLevel = async (req, res) => {
  try {
    const batch = normalizeBatch(req.params.batch);
    const removed = await BatchLevel.findOneAndDelete({ batch });

    if (!removed) {
      return res.status(404).json({ message: 'Batch assignment not found' });
    }

    return res.json({
      message: `Batch ${batch} assignment removed`,
      batch,
      level: removed.level,
    });
  } catch (err) {
    console.error('removeBatchLevel error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBatchLevels,
  getDistinctBatches,
  getMyAssignedLevel,
  assignBatchLevel,
  removeBatchLevel,
};
