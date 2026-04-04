const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getBatchLevels,
  getDistinctBatches,
  getMyAssignedLevel,
  assignBatchLevel,
  removeBatchLevel,
} = require('../controllers/batchLevelController');

const router = express.Router();

router.get('/batch-levels/me', authMiddleware, getMyAssignedLevel);
router.get('/batch-levels', authMiddleware, requireRole('superadmin'), getBatchLevels);
router.get('/batch-levels/batches', authMiddleware, requireRole('superadmin'), getDistinctBatches);
router.post('/batch-levels', authMiddleware, requireRole('superadmin'), assignBatchLevel);
router.delete('/batch-levels/:batch', authMiddleware, requireRole('superadmin'), removeBatchLevel);

module.exports = router;
