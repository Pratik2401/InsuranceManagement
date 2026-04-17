const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all policies (formatted for "New Business" UI)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        DATE_FORMAT(p.start_date, '%d %b %Y') as date,
        p.type,
        p.company,
        p.policy_type as policyType,
        CONCAT(c.first_name, ' ', c.last_name) as holder,
        p.policy_number as number,
        p.premium_amount as gwp
      FROM policies p
      JOIN customers c ON p.customer_id = c.id
      ORDER BY p.start_date DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST a new policy (optional)
router.post('/', async (req, res) => {
  try {
    const { policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status } = req.body;
    const insertQuery = `
      INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertQuery, [
      policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status || 'pending'
    ]);
    res.status(201).json({ id: result.insertId, policy_number, customer_id });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
