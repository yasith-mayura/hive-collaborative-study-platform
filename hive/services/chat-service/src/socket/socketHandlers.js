const Message = require('../models/messageModel');

const buildRoomName = (batch) => `batch_${batch}`;

const attachChatSocketHandlers = (io, socket) => {
  const { batch, uid, name, studentNumber } = socket.data.userProfile;
  const batchValue = String(batch);
  const room = buildRoomName(batchValue);

  socket.join(room);
  socket.data.room = room;
  socket.data.batch = batchValue;

  socket.emit('chat:ready', {
    room,
    batch: batchValue,
    groupName: `Batch ${batchValue} Group Chat`,
  });

  Message.find({ batch: batchValue })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean()
    .then((recent) => {
      socket.emit('chat:history', {
        room,
        batch: batchValue,
        messages: recent.reverse(),
      });
    })
    .catch((err) => {
      console.error('chat history load error', err);
      socket.emit('chat:error', { message: 'Failed to load chat history' });
    });

  socket.on('chat:send', async ({ content }) => {
    try {
      const trimmedContent = (content || '').trim();
      if (!trimmedContent) return;

      const message = await Message.create({
        batch: batchValue,
        senderId: uid,
        senderName: name,
        senderStudentNumber: studentNumber,
        content: trimmedContent,
        timestamp: new Date(),
      });

      const payload = {
        _id: message._id,
        batch: message.batch,
        senderId: message.senderId,
        senderName: message.senderName,
        senderStudentNumber: message.senderStudentNumber,
        content: message.content,
        timestamp: message.timestamp,
      };

      io.to(room).emit('chat:message', payload);
    } catch (err) {
      console.error('chat send error', err);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`socket disconnected: ${socket.id} (${reason})`);
  });
};

module.exports = {
  attachChatSocketHandlers,
  buildRoomName,
};
