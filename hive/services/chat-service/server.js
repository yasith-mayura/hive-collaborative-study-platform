const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const messageRoutes = require('./src/routes/messageRoutes');
const authMiddleware = require('./src/middleware/authMiddleware');
const ChatUser = require('./src/models/userModel');
const { attachChatSocketHandlers, buildRoomName } = require('./src/socket/socketHandlers');

dotenv.config();
const PORT = process.env.PORT || 3003;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'chat-service' }));

app.use('/api/chat', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.use(async (socket, next) => {
  try {
    const decoded = await authMiddleware.verifySocketToken(socket);

    const user = await ChatUser.findOne({
      firebaseUid: decoded.uid,
      isActive: true,
    }).lean();

    if (!user) {
      return next(new Error('User not found')); 
    }

    if (user.batch === undefined || user.batch === null) {
      return next(new Error('User batch not configured'));
    }

    const batchValue = String(user.batch);

    socket.data.userProfile = {
      uid: decoded.uid,
      name: user.name || decoded.name || decoded.email || 'Student',
      studentNumber: user.studentNumber || 'N/A',
      batch: batchValue,
      room: buildRoomName(batchValue),
      role: user.role || decoded.role || 'student',
    };

    return next();
  } catch (error) {
    return next(new Error(error.message || 'Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  attachChatSocketHandlers(io, socket);
});

server.listen(PORT, () => console.log(`chat-service listening on ${PORT}`));
