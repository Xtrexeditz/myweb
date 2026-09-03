require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const requestIp = require('request-ip');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/xtrex_portfolio';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

// API Routes
app.use('/api', apiRoutes);

// Serve static frontend files from the root workspace
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// Serve index.html as homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

// Database Connection with resilient fallback
let isDbConnected = false;

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isDbConnected = true;
    console.log('----------------------------------------------------');
    console.log('🚀 [MongoDB Atlas] Connected successfully to Database!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.warn('⚠️  [MongoDB Warning]: Could not connect to MongoDB:', error.message);
    console.warn('👉 Please ensure your MONGODB_URI in .env is correct (e.g. MongoDB Atlas cluster string).');
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🏎️  XTrex Portfolio & Visitor Tracking Server Live!`);
  console.log(`📍 Web App:        http://localhost:${PORT}`);
  console.log(`⚡ Admin Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`📊 API Base:       http://localhost:${PORT}/api`);
  console.log('====================================================');
  await connectDatabase();
});
