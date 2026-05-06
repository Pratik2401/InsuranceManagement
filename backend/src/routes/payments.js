const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(verifyToken, requireAgent);

// GET payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create payment
router.post('/', async (req, res) => {
  try {
    const { policy_id, amount, payment_date, payment_method, status, transaction_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO payments (policy_id, amount, payment_date, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?)',
      [policy_id, amount, payment_date, payment_method, status, transaction_id]
    );
    try { await logAudit(req.user?.id, 'payment.create', 'payment', result.insertId, { policy_id, amount }); } catch (e) {}
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update payment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { policy_id, amount, payment_date, payment_method, status, transaction_id } = req.body;
    const [result] = await pool.query(
      'UPDATE payments SET policy_id = ?, amount = ?, payment_date = ?, payment_method = ?, status = ?, transaction_id = ? WHERE id = ?',
      [policy_id, amount, payment_date, payment_method, status, transaction_id, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    try { await logAudit(req.user?.id, 'payment.update', 'payment', id, { policy_id, amount }); } catch (e) {}
    res.json({ message: 'Payment updated' });
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    try { await logAudit(req.user?.id, 'payment.delete', 'payment', id); } catch (e) {}
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
