require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();
const PORT = process.env.PORT || 3001;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'user-service' }));

app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log('user-service listening on port', PORT);
});