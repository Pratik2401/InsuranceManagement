const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Protect policy routes: only agents may access policy endpoints
router.use(verifyToken, requireAgent);

const uploadDir = path.join(__dirname, '../../uploads/policies');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

function normalizePolicyStatus(status) {
  const value = String(status || 'active').trim().toLowerCase();
  if (value === 'open') return 'active';
  if (value === 'active' || value === 'expired' || value === 'cancelled' || value === 'pending') {
    return value;
  }
  return 'active';
}

function displayPolicyStatus(status) {
  const value = String(status || 'active').trim().toLowerCase();
  if (value === 'active') return 'Active';
  if (value === 'expired') return 'Expired';
  if (value === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function normalizeRenewalPeriod(period) {
  return String(period || 'Yearly').trim().toLowerCase() === 'monthly' ? 'Monthly' : 'Yearly';
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
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

function buildPolicyPdfPath(policyId) {
  return path.join(uploadDir, `${policyId}.pdf`);
}

function buildPolicyPdfUrl(policyId) {
  const pdfPath = buildPolicyPdfPath(policyId);
  return fs.existsSync(pdfPath) ? `/uploads/policies/${policyId}.pdf` : null;
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
    throw new Error('Holder name is required');
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

async function persistPolicyPdf(policyId, file) {
  if (!file) return;
  await fs.promises.writeFile(buildPolicyPdfPath(policyId), file.buffer);
}

function mapPolicyRow(row) {
  const startDate = row.startDate || row.date;
  return {
    id: row.id,
    date: startDate ? new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    startDate: startDate || '',
    endDate: row.endDate || '',
    renewalPeriod: row.renewalPeriod || 'Yearly',
    type: row.type || 'General',
    company: row.company || '',
    policyType: row.policyType || '',
    holder: row.holder || '',
    number: row.number || '',
    gwp: Number(row.gwp || 0),
    status: displayPolicyStatus(row.status),
    isRenewal: !!row.is_renewal,
    pdfUrl: buildPolicyPdfUrl(row.id),
  };
}

// GET all policies (formatted for "New Business" UI)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        DATE_FORMAT(p.start_date, '%Y-%m-%d') as startDate,
        DATE_FORMAT(p.end_date, '%Y-%m-%d') as endDate,
        CASE
          WHEN DATEDIFF(p.end_date, p.start_date) <= 35 THEN 'Monthly'
          ELSE 'Yearly'
        END as renewalPeriod,
        p.type,
        p.company,
        p.policy_type as policyType,
        COALESCE(CONCAT(c.first_name, ' ', c.last_name), '') as holder,
        p.policy_number as number,
        p.premium_amount as gwp,
        p.status,
        p.is_renewal
      FROM policies p
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.start_date DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows.map(mapPolicyRow));
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST a new policy (optional)
router.post('/', upload.single('policyPdf'), async (req, res) => {
  try {
    const {
      policy_number,
      customer_id,
      holder,
      type,
      company,
      policyType,
      policy_type,
      gwp,
      premium_amount,
      coverage_amount,
      date,
      start_date,
      end_date,
      endDate,
      renewalPeriod,
      renewal_period,
      status,
      isRenewal,
      is_renewal,
    } = req.body;

    const resolvedHolder = holder || req.body.customerName || '';
    const resolvedStartDate = normalizeDate(date || start_date);
    const resolvedRenewalPeriod = normalizeRenewalPeriod(renewalPeriod || renewal_period);
    const resolvedEndDate = normalizeDate(endDate || end_date || addRenewalPeriod(resolvedStartDate, resolvedRenewalPeriod));
    const resolvedStatus = normalizePolicyStatus(status);
    const resolvedCustomerId = await getOrCreateCustomer(resolvedHolder, customer_id);
    const resolvedPremium = Number(gwp ?? premium_amount ?? 0);
    const resolvedPolicyType = policyType || policy_type || 'Other';
    const resolvedIsRenewal = isRenewal === 'true' || isRenewal === true || is_renewal === 'true' || is_renewal === true;
    const insertQuery = `
      INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status, is_renewal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertQuery, [
      policy_number,
      resolvedCustomerId,
      type || 'General',
      company || 'Unknown',
      resolvedPolicyType,
      resolvedPremium,
      Number(coverage_amount || 0),
      resolvedStartDate,
      resolvedEndDate,
      resolvedStatus,
      resolvedIsRenewal,
    ]);

    await persistPolicyPdf(result.insertId, req.file);
    try { await logAudit(req.user?.id, 'policy.create', 'policy', result.insertId, { policy_number }); } catch (e) {}

    res.status(201).json({
      id: result.insertId,
      policy_number,
      customer_id: resolvedCustomerId,
      holder: resolvedHolder,
      date: resolvedStartDate,
      endDate: resolvedEndDate,
      renewalPeriod: resolvedRenewalPeriod,
      pdfUrl: buildPolicyPdfUrl(result.insertId),
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// POST bulk policies
router.post('/bulk', async (req, res) => {
  try {
    const policies = req.body; // Expect array of objects
    if (!Array.isArray(policies) || policies.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty policies array.' });
    }

    let count = 0;

    for (const policy of policies) {
      const resolvedHolder = policy.holder || policy.customerName || 'Unknown Holder';
      const resolvedCustomerId = await getOrCreateCustomer(resolvedHolder, policy.customer_id);
      const resolvedStartDate = normalizeDate(policy.date || policy.startDate || policy.start_date);
      const resolvedRenewalPeriod = normalizeRenewalPeriod(policy.renewalPeriod || policy.renewal_period);
      const resolvedEndDate = normalizeDate(policy.endDate || policy.end_date || addRenewalPeriod(resolvedStartDate, resolvedRenewalPeriod));
      const resolvedIsRenewal = policy.isRenewal === 'true' || policy.isRenewal === true || policy.is_renewal === 'true' || policy.is_renewal === true;

      const [result] = await pool.query(
        `
          INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status, is_renewal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          policy.number || policy.policy_number,
          resolvedCustomerId,
          policy.type || 'General',
          policy.company || 'Unknown',
          policy.policyType || policy.policy_type || 'Other',
          Number(policy.gwp || policy.premium_amount || 0),
          Number(policy.coverage_amount || 0),
          resolvedStartDate,
          resolvedEndDate,
          normalizePolicyStatus(policy.status),
          resolvedIsRenewal,
        ]
      );

      count += result.affectedRows;
    }
    try { await logAudit(req.user?.id, 'policy.bulk_import', 'policy', null, { count: policies.length }); } catch (e) {}
    res.status(201).json({ message: 'Policies imported successfully', count });
  } catch (error) {
    console.error('Error bulk creating policies:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// PUT update a policy
router.put('/:id', upload.single('policyPdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM policies WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const {
      number,
      policy_number,
      holder,
      type,
      company,
      policyType,
      policy_type,
      gwp,
      premium_amount,
      date,
      start_date,
      endDate,
      end_date,
      renewalPeriod,
      renewal_period,
      status,
      isRenewal,
      is_renewal,
    } = req.body;

    const resolvedNumber = number || policy_number || existingRows[0].policy_number;
    const resolvedHolder = holder || '';
    const resolvedStartDate = normalizeDate(date || start_date || existingRows[0].start_date);
    const resolvedRenewalPeriod = normalizeRenewalPeriod(renewalPeriod || renewal_period || 'Yearly');
    const resolvedEndDate = normalizeDate(endDate || end_date || addRenewalPeriod(resolvedStartDate, resolvedRenewalPeriod));
    const resolvedCustomerId = await getOrCreateCustomer(resolvedHolder || `${existingRows[0].policy_number} Holder`, existingRows[0].customer_id);
    const resolvedIsRenewal = isRenewal !== undefined ? (isRenewal === 'true' || isRenewal === true) : !!existingRows[0].is_renewal;

    const updateQuery = `
      UPDATE policies 
      SET policy_number = ?, customer_id = ?, type = ?, company = ?, policy_type = ?, premium_amount = ?, coverage_amount = ?, start_date = ?, end_date = ?, status = ?, is_renewal = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.query(updateQuery, [
      resolvedNumber,
      resolvedCustomerId,
      type || existingRows[0].type,
      company || existingRows[0].company,
      policyType || policy_type || existingRows[0].policy_type,
      Number(gwp ?? premium_amount ?? existingRows[0].premium_amount ?? 0),
      Number(existingRows[0].coverage_amount || 0),
      resolvedStartDate,
      resolvedEndDate,
      normalizePolicyStatus(status || existingRows[0].status),
      resolvedIsRenewal,
      id,
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await persistPolicyPdf(id, req.file);

    try { await logAudit(req.user?.id, 'policy.update', 'policy', id, { policy_number: resolvedNumber }); } catch (e) {}

    res.json({
      message: 'Policy updated successfully',
      id: Number(id),
      number: resolvedNumber,
      holder: resolvedHolder,
      date: resolvedStartDate,
      endDate: resolvedEndDate,
      renewalPeriod: resolvedRenewalPeriod,
      pdfUrl: buildPolicyPdfUrl(id),
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// DELETE a policy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfPath = buildPolicyPdfPath(id);
    const [result] = await pool.query('DELETE FROM policies WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (fs.existsSync(pdfPath)) {
      await fs.promises.unlink(pdfPath);
    }

    try { await logAudit(req.user?.id, 'policy.delete', 'policy', id); } catch (e) {}
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
