const pool = require('../config/db');

/**
 * Simple audit logger helper.
 * Usage: await logAudit(actorId, action, entityType, entityId, detailsObj)
 */
async function logAudit(actorId, action, entityType = null, entityId = null, details = null) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    await pool.query(
      'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [actorId || null, action, entityType, entityId, detailsJson]
    );
  } catch (err) {
    // Don't throw — audit failures shouldn't break main flows. Log server-side.
    console.error('Audit log error:', err);
  }
}

module.exports = { logAudit };
