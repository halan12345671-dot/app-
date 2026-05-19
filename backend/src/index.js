const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

dotenv.config();

const passport = require('passport');
require('./config/passport');

const app = express();

app.use(passport.initialize());

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin || corsOrigin === '*') {
  app.use(cors());
} else {
  const origins = corsOrigin.split(',').map(o => o.trim());
  app.use(cors({ origin: origins }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Protect API routes with JWT auth middleware
const { authenticate } = require('./middleware/auth');
app.use('/api/customers', authenticate, require('./routes/customerRoutes'));
app.use('/api/products', authenticate, require('./routes/productRoutes'));
app.use('/api/inventory', authenticate, require('./routes/inventoryRoutes'));
app.use('/api/sales-orders', authenticate, require('./routes/salesOrderRoutes'));
app.use('/api/purchase-orders', authenticate, require('./routes/purchaseOrderRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Debug environment config (safe fields only)
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    FRONTEND_URL: process.env.FRONTEND_URL || null,
    CORS_ORIGIN: process.env.CORS_ORIGIN || null,
    NODE_ENV: process.env.NODE_ENV || null,
    HAS_GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    HAS_GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    status: err.status || 500,
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  });

module.exports = app;
