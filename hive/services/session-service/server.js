const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();
const PORT = process.env.PORT || 3006;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'session-service' }));

app.listen(PORT, () => {
  console.log('session-service listening on port', PORT);
});
