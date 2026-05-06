const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(verifyToken, requireAgent);

// GET customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, dob, address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, phone, dob, address) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, dob, address]
    );
    try { await logAudit(req.user?.id, 'customer.create', 'customer', result.insertId, { email }); } catch (e) {}
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, dob, address } = req.body;
    const [result] = await pool.query(
      'UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, dob = ?, address = ? WHERE id = ?',
      [first_name, last_name, email, phone, dob, address, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
    try { await logAudit(req.user?.id, 'customer.update', 'customer', id, { email }); } catch (e) {}
    res.json({ message: 'Customer updated' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
    try { await logAudit(req.user?.id, 'customer.delete', 'customer', id); } catch (e) {}
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
