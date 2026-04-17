const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all leads
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST a new lead (optional for now, but good to have)
router.post('/', async (req, res) => {
  try {
    const { name, phone, product, status, date } = req.body;
    const insertQuery = `
      INSERT INTO leads (name, phone, product, status, date)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertQuery, [name, phone, product, status || 'Active', date]);
    res.status(201).json({ id: result.insertId, name, phone, product, status, date });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
