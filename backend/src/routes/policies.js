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
        p.premium_amount as gwp,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') as endDate
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

// POST bulk policies
router.post('/bulk', async (req, res) => {
  try {
    const policies = req.body; // Expect array of objects
    if (!Array.isArray(policies) || policies.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty policies array.' });
    }

    const insertQuery = `
      INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status)
      VALUES ?
    `;

    // Assuming imported policies might not have customer_id readily mapped, we'll assign null or 1.
    // For a real app, you'd match the holder name to a customer.
    // Here we'll map holder to a dummy customer_id or try to find one. We'll default to 1.
    const values = policies.map(p => [
      p.number || p.policy_number, 
      p.customer_id || 1, 
      p.type || 'General', 
      p.company || 'Unknown', 
      p.policyType || 'Other', 
      p.gwp || 0, // premium_amount
      0, // coverage_amount default
      p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // start_date
      new Date(Date.now() + 31536000000).toISOString().split('T')[0], // end_date (1 year from now)
      p.status || 'Active'
    ]);

    const [result] = await pool.query(insertQuery, [values]);
    res.status(201).json({ message: 'Policies imported successfully', count: result.affectedRows });
  } catch (error) {
    console.error('Error bulk creating policies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update a policy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // UI fields might send custom mapped data, we'll map it to DB columns
    const { number, type, company, policyType, gwp, date } = req.body;
    
    // Note: To fully update holder name, we'd need to update the customers table. 
    // We will just update policy fields for now.
    const updateQuery = `
      UPDATE policies 
      SET policy_number = ?, type = ?, company = ?, policy_type = ?, premium_amount = ?, start_date = ?
      WHERE id = ?
    `;
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    const [result] = await pool.query(updateQuery, [
      number, type, company, policyType, gwp, formattedDate, id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy updated successfully' });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE a policy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM policies WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
