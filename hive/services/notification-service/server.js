require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const notificationRoutes = require('./src/routes/notificationRoutes');
const { initFirebaseAdmin } = require('./src/config/firebaseConfig');
const { startSessionReminderScheduler } = require('./src/scheduler/sessionReminder');

const PORT = process.env.PORT || 3007;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');
initFirebaseAdmin();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/notifications', notificationRoutes);

app.listen(PORT, () => {
  console.log(`notification-service listening on ${PORT}`);
  startSessionReminderScheduler();
});
