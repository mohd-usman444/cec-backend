// server.js – Entry point for the backend API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'https://cec-frontend-beta.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Simple health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
app.get('/', (req, res) => {
  res.send('CEC Backend Running Successfully');
});


const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const workerRoutes = require('./routes/workerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const otherExpenseRoutes = require('./routes/otherExpenseRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/other-expenses', otherExpenseRoutes);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
