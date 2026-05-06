const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Protect leads routes: only agents may access lead endpoints
router.use(verifyToken, requireAgent);

function normalizeLeadStatus(status) {
  const value = String(status || 'Open').trim().toLowerCase();
  if (value === 'active' || value === 'open') return 'Open';
  if (value === 'converted') return 'Converted';
  if (value === 'lost') return 'Lost';
  return 'Open';
}

function displayLeadStatus(status) {
  const value = String(status || 'Open').trim().toLowerCase();
  if (value === 'converted') return 'Converted';
  if (value === 'lost') return 'Lost';
  return 'Open';
}

// GET all leads
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads ORDER BY date DESC');
    res.json(rows.map((row) => ({
      ...row,
      status: displayLeadStatus(row.status),
    })));
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
    const resolvedStatus = normalizeLeadStatus(status);
    const [result] = await pool.query(insertQuery, [name, phone, product, resolvedStatus, date]);
    try { await logAudit(req.user?.id, 'lead.create', 'lead', result.insertId, { name, product }); } catch (e) {}
    res.status(201).json({ id: result.insertId, name, phone, product, status: resolvedStatus, date });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST bulk leads
router.post('/bulk', async (req, res) => {
  try {
    const leads = req.body; // Expecting an array of objects
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty leads array.' });
    }

    const insertQuery = `
      INSERT INTO leads (name, phone, product, status, date)
      VALUES ?
    `;

    const values = leads.map(lead => [
      lead.name, 
      lead.phone, 
      lead.product, 
      normalizeLeadStatus(lead.status), 
      lead.date || new Date().toISOString().split('T')[0]
    ]);

    const [result] = await pool.query(insertQuery, [values]);
    try { await logAudit(req.user?.id, 'lead.bulk_import', 'lead', null, { count: leads.length }); } catch (e) {}
    res.status(201).json({ message: 'Leads imported successfully', count: result.affectedRows });
  } catch (error) {
    console.error('Error bulk creating leads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update a lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, product, status, date } = req.body;
    
    const updateQuery = `
      UPDATE leads 
      SET name = ?, phone = ?, product = ?, status = ?, date = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(updateQuery, [name, phone, product, normalizeLeadStatus(status), date, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    try { await logAudit(req.user?.id, 'lead.update', 'lead', id, { name, product }); } catch (e) {}
    res.json({ id, name, phone, product, status: normalizeLeadStatus(status), date });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE a lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM leads WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    try { await logAudit(req.user?.id, 'lead.delete', 'lead', id); } catch (e) {}
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
