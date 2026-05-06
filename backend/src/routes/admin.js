const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

const recordAuditLog = async ({ actorId, action, entityType, entityId = null, details = null }) => {
  await pool.query(
    'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
    [actorId, action, entityType, entityId, details ? JSON.stringify(details) : null]
  );
};

router.get('/summary', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT role, is_active FROM users');
    const [policies] = await pool.query('SELECT status, premium_amount, end_date FROM policies');
    const [leads] = await pool.query('SELECT status FROM leads');
    const [claims] = await pool.query('SELECT status FROM claims');
    const [payments] = await pool.query('SELECT status, amount FROM payments');
    const [settings] = await pool.query('SELECT COUNT(*) AS total FROM app_settings');

    res.json({
      users: {
        total: users.length,
        active: users.filter((user) => Number(user.is_active ?? 1) === 1).length,
        admin: users.filter((user) => String(user.role || '').toLowerCase() === 'admin').length,
        agent: users.filter((user) => String(user.role || '').toLowerCase() === 'agent').length,
      },
      policies: {
        total: policies.length,
        active: policies.filter((policy) => String(policy.status || '').toLowerCase() === 'active').length,
        renewalsDue: policies.filter((policy) => {
          const endDate = policy.end_date;
          if (!endDate) return false;
          const parsedEndDate = new Date(endDate);
          if (Number.isNaN(parsedEndDate.getTime())) return false;
          const daysLeft = (parsedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysLeft >= 0 && daysLeft <= 30;
        }).length,
        totalGwp: policies.reduce((sum, policy) => sum + Number(policy.premium_amount || 0), 0),
      },
      leads: {
        total: leads.length,
        open: leads.filter((lead) => String(lead.status || '').toLowerCase() === 'open').length,
        converted: leads.filter((lead) => String(lead.status || '').toLowerCase() === 'converted').length,
      },
      claims: {
        total: claims.length,
        submitted: claims.filter((claim) => String(claim.status || '').toLowerCase() === 'submitted').length,
      },
      payments: {
        total: payments.length,
        successful: payments.filter((payment) => String(payment.status || '').toLowerCase() === 'success').length,
        totalCollections: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      },
      settings: {
        total: Number(settings[0]?.total || 0),
      },
    });
  } catch (error) {
    console.error('Error building admin summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const nextRole = role === 'admin' ? 'admin' : 'agent';
    const nextActive = Number(isActive) === 0 ? 0 : 1;

    const [result] = await pool.query(
      'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
      [nextRole, nextActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await recordAuditLog({
      actorId: req.user.id,
      action: 'update_user',
      entityType: 'user',
      entityId: id,
      details: { role: nextRole, isActive: nextActive },
    });

    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, setting_key AS settingKey, setting_value AS settingValue, category, description, updated_at AS updatedAt FROM app_settings ORDER BY category ASC, setting_key ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.settings) ? req.body.settings : [];
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Settings array is required.' });
    }

    for (const setting of updates) {
      const settingKey = String(setting.settingKey || setting.key || '').trim();
      const settingValue = String(setting.settingValue ?? setting.value ?? '').trim();
      if (!settingKey) continue;

      await pool.query(
        `INSERT INTO app_settings (setting_key, setting_value, category, description, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), category = VALUES(category), description = VALUES(description), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
        [
          settingKey,
          settingValue,
          String(setting.category || 'general'),
          String(setting.description || ''),
          req.user.id,
        ]
      );
    }

    await recordAuditLog({
      actorId: req.user.id,
      action: 'update_settings',
      entityType: 'settings',
      details: { count: updates.length },
    });

    res.json({ message: 'Settings saved successfully.' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT al.id, al.action, al.entity_type AS entityType, al.entity_id AS entityId, al.details, al.created_at AS createdAt, u.name AS actorName, u.email AS actorEmail
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );

    res.json(rows.map((row) => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
    })));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;