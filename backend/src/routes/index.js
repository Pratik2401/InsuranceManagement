const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Health Check Route
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 + 1 AS solution');
    res.json({
      status: 'UP',
      db: 'connected',
      message: 'API is running properly.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      db: 'disconnected',
      message: error.message,
    });
  }
});

// Mount feature routes
router.use('/auth', require('./auth'));
router.use('/leads', require('./leads'));
router.use('/policies', require('./policies'));
router.use('/products', require('./products'));

// Export AFTER all route mounts
module.exports = router;
