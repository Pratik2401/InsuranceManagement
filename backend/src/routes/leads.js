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

function normalizeDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function normalizeRenewalPeriod(period) {
  return String(period || 'Yearly').trim().toLowerCase() === 'monthly' ? 'Monthly' : 'Yearly';
}

function parseBoolean(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return String(value || '').toLowerCase() === 'true' || value === '1';
}

function addRenewalPeriod(startDate, renewalPeriod) {
  const date = new Date(startDate);
  if (renewalPeriod === 'Monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().split('T')[0];
}

function splitHolderName(holder) {
  const trimmed = String(holder || '').trim();
  if (!trimmed) return { firstName: 'Unknown', lastName: 'Holder' };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || 'Unknown';
  const lastName = parts.length > 0 ? parts.join(' ') : 'Holder';
  return { firstName, lastName };
}

async function getOrCreateCustomer(holder, explicitCustomerId) {
  if (explicitCustomerId) {
    const customerId = Number(explicitCustomerId);
    if (!Number.isNaN(customerId) && customerId > 0) {
      const [rows] = await pool.query('SELECT id FROM customers WHERE id = ?', [customerId]);
      if (rows.length > 0) return customerId;
    }
  }

  const normalizedHolder = String(holder || '').trim();
  if (!normalizedHolder) {
    throw new Error('Lead name is required');
  }

  const [existingRows] = await pool.query(
    'SELECT id FROM customers WHERE CONCAT(first_name, " ", last_name) = ? LIMIT 1',
    [normalizedHolder]
  );

  if (existingRows.length > 0) {
    return existingRows[0].id;
  }

  const { firstName, lastName } = splitHolderName(normalizedHolder);
  const emailSlug = normalizedHolder.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  const email = `${emailSlug || 'customer'}@local.invalid`;

  try {
    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, email) VALUES (?, ?, ?)',
      [firstName, lastName, email]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const [rows] = await pool.query('SELECT id FROM customers WHERE email = ? LIMIT 1', [email]);
      if (rows.length > 0) return rows[0].id;
    }
    throw error;
  }
}

function buildLeadResponse(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    product: row.product,
    status: displayLeadStatus(row.status),
    date: row.date || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    convertedPolicyNumber: row.convertedPolicyNumber || `LEAD-${row.id}`,
    businessType: row.businessType || row.product || 'General',
    businessCompany: row.businessCompany || '',
    businessPolicyType: row.businessPolicyType || '',
    businessGwp: Number(row.businessGwp || 0),
    businessCoverageAmount: Number(row.businessCoverageAmount || 0),
    businessDate: row.businessDate || row.date || '',
    businessEndDate: row.businessEndDate || '',
    businessRenewalPeriod: row.businessRenewalPeriod || 'Yearly',
    businessIsRenewal: parseBoolean(row.businessIsRenewal),
  };
}

async function upsertConvertedPolicy(leadId, leadData) {
  const policyNumber = `LEAD-${leadId}`;
  const customerId = await getOrCreateCustomer(leadData.name || leadData.holder || 'Converted Lead', leadData.customer_id);
  const startDate = normalizeDate(leadData.businessDate || leadData.start_date || leadData.date);
  const renewalPeriod = normalizeRenewalPeriod(leadData.businessRenewalPeriod || leadData.renewalPeriod || leadData.renewal_period);
  const endDate = normalizeDate(leadData.businessEndDate || leadData.end_date || addRenewalPeriod(startDate, renewalPeriod));
  const type = leadData.businessType || leadData.type || leadData.product || 'General';
  const company = leadData.businessCompany || leadData.company || 'Unknown';
  const policyType = leadData.businessPolicyType || leadData.policyType || 'Converted Lead';
  const premiumAmount = Number(leadData.businessGwp ?? leadData.gwp ?? leadData.premium_amount ?? 0);
  const coverageAmount = Number(leadData.businessCoverageAmount ?? leadData.coverage_amount ?? 0);
  const isRenewal = parseBoolean(leadData.businessIsRenewal ?? leadData.isRenewal ?? leadData.is_renewal);

  const [existingRows] = await pool.query('SELECT id FROM policies WHERE policy_number = ? LIMIT 1', [policyNumber]);

  if (existingRows.length > 0) {
    await pool.query(
      `UPDATE policies
       SET customer_id = ?, type = ?, company = ?, policy_type = ?, premium_amount = ?, coverage_amount = ?, start_date = ?, end_date = ?, status = ?, is_renewal = ?
       WHERE policy_number = ?`,
      [customerId, type, company, policyType, premiumAmount, coverageAmount, startDate, endDate, 'active', isRenewal, policyNumber]
    );
    return policyNumber;
  }

  await pool.query(
    `INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status, is_renewal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [policyNumber, customerId, type, company, policyType, premiumAmount, coverageAmount, startDate, endDate, 'active', isRenewal]
  );

  return policyNumber;
}

// GET all leads
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        l.*,
        p.type AS businessType,
        p.company AS businessCompany,
        p.policy_type AS businessPolicyType,
        p.premium_amount AS businessGwp,
        p.coverage_amount AS businessCoverageAmount,
        DATE_FORMAT(p.start_date, '%Y-%m-%d') AS businessDate,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') AS businessEndDate,
        CASE
          WHEN DATEDIFF(p.end_date, p.start_date) <= 35 THEN 'Monthly'
          ELSE 'Yearly'
        END AS businessRenewalPeriod,
        p.is_renewal AS businessIsRenewal
      FROM leads l
      LEFT JOIN policies p ON p.policy_number = CONCAT('LEAD-', l.id)
      ORDER BY l.date DESC
    `);
    res.json(rows.map(buildLeadResponse));
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
    const resolvedDate = normalizeDate(date);
    const [result] = await pool.query(insertQuery, [name, phone, product, resolvedStatus, resolvedDate]);

    if (resolvedStatus === 'Converted') {
      await upsertConvertedPolicy(result.insertId, {
        ...req.body,
        name,
        phone,
        product,
        status: resolvedStatus,
        date: resolvedDate,
      });
    }

    try { await logAudit(req.user?.id, 'lead.create', 'lead', result.insertId, { name, product }); } catch (e) {}
    res.status(201).json({
      id: result.insertId,
      name,
      phone,
      product,
      status: resolvedStatus,
      date: resolvedDate,
      converted_policy_number: `LEAD-${result.insertId}`,
    });
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
      normalizeDate(lead.date)
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

    const [existingRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const updateQuery = `
      UPDATE leads 
      SET name = ?, phone = ?, product = ?, status = ?, date = ?
      WHERE id = ?
    `;
    const resolvedStatus = normalizeLeadStatus(status);
    const resolvedDate = normalizeDate(date || existingRows[0].date);
    const [result] = await pool.query(updateQuery, [name, phone, product, resolvedStatus, resolvedDate, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (resolvedStatus === 'Converted') {
      await upsertConvertedPolicy(id, {
        ...existingRows[0],
        ...req.body,
        name,
        phone,
        product,
        status: resolvedStatus,
        date: resolvedDate,
      });
    }

    try { await logAudit(req.user?.id, 'lead.update', 'lead', id, { name, product }); } catch (e) {}
    res.json({
      id,
      name,
      phone,
      product,
      status: resolvedStatus,
      date: resolvedDate,
      converted_policy_number: `LEAD-${id}`,
    });
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
