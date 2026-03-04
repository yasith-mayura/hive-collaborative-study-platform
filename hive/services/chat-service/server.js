const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const Message = require('./src/models/messageModel');
const messageRoutes = require('./src/routes/messageRoutes');

dotenv.config();
const PORT = process.env.PORT || 3003;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');


const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'chat-service' }));

app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Track socket -> user & room
const socketUserMap = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join room
  socket.on('joinGroup', async ({ room, username }) => {
    socket.join(room);
    socketUserMap[socket.id] = { room, username };

    // Send past messages
    const pastMessages = await Message.find({ room }).sort({ time: 1 });
    socket.emit('pastMessages', pastMessages);

    // Notify batch
    const systemMsg = {
      username: 'System',
      message: `${username} joined batch ${room}`,
      time: new Date(),
      system: true,
    };
    io.to(room).emit('receiveMessage', systemMsg);
    await Message.create({ room, username: 'System', message: systemMsg.message });
  });

  // Send chat message
  socket.on('sendMessage', async ({ room, username, message }) => {
    const msgData = { room, username, message, time: new Date() };
    await Message.create(msgData);
    io.to(room).emit('receiveMessage', msgData);
  });

  // Leave room manually
  socket.on('leaveGroup', async () => {
    const user = socketUserMap[socket.id];
    if (user) {
      const { room, username } = user;

      const systemMsg = {
        username: 'System',
        message: `${username} left batch ${room}`,
        time: new Date(),
        system: true,
      };
      io.to(room).emit('receiveMessage', systemMsg);
      await Message.create({ room, username: 'System', message: systemMsg.message });

      socket.leave(room);
      delete socketUserMap[socket.id];
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    const user = socketUserMap[socket.id];
    if (user) {
      const { room, username } = user;

      const systemMsg = {
        username: 'System',
        message: `${username} disconnected from batch ${room}`,
        time: new Date(),
        system: true,
      };
      io.to(room).emit('receiveMessage', systemMsg);
      await Message.create({ room, username: 'System', message: systemMsg.message });

      delete socketUserMap[socket.id];
    }
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`chat-service listening on ${PORT}`));