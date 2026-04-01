const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const progressRoutes = require('./src/routes/progressRoutes');

dotenv.config();
const PORT = process.env.PORT || 3005;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'progress-service' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'progress-service' }));
app.use('/api/progress', progressRoutes);

app.listen(PORT, () => {
  console.log('progress-service listening on port', PORT);
});
