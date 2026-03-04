const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');

// Get all past messages for a room
router.get('/:room', async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;