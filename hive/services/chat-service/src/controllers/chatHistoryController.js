const Message = require('../models/messageModel');
const ChatUser = require('../models/userModel');

const getBatchHistory = async (req, res) => {
  try {
    const { batch } = req.params;
    const batchValue = String(batch).trim();

    if (!batchValue) {
      return res.status(400).json({ message: 'Batch is required' });
    }

    const requester = await ChatUser.findOne({
      firebaseUid: req.user.uid,
      isActive: true,
    }).lean();

    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Students can only read their own batch history.
    if (requester.role === 'student' && String(requester.batch) !== batchValue) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const recentMessages = await Message.find({ batch: batchValue })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const messages = recentMessages.reverse();

    return res.json({
      batch: batchValue,
      room: `batch_${batchValue}`,
      messages,
    });
  } catch (err) {
    console.error('getBatchHistory error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBatchHistory,
};
