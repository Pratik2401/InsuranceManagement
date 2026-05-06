const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(verifyToken, requireAgent);

// GET claims
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM claims ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching claims:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create claim
router.post('/', async (req, res) => {
  try {
    const { claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO claims (claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status]
    );
    try { await logAudit(req.user?.id, 'claim.create', 'claim', result.insertId, { claim_number }); } catch (e) {}
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating claim:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update claim
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status } = req.body;
    const [result] = await pool.query(
      'UPDATE claims SET claim_number = ?, policy_id = ?, customer_id = ?, claim_amount = ?, description = ?, date_of_incident = ?, status = ? WHERE id = ?',
      [claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Claim not found' });
    try { await logAudit(req.user?.id, 'claim.update', 'claim', id, { claim_number }); } catch (e) {}
    res.json({ message: 'Claim updated' });
  } catch (err) {
    console.error('Error updating claim:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE claim
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM claims WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Claim not found' });
    try { await logAudit(req.user?.id, 'claim.delete', 'claim', id); } catch (e) {}
    res.json({ message: 'Claim deleted' });
  } catch (err) {
    console.error('Error deleting claim:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
