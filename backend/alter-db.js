require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insurance_management'
  });

  try {
    await connection.query("ALTER TABLE policies MODIFY status ENUM('active', 'expired', 'cancelled', 'pending', 'pending_renewal') DEFAULT 'pending'");
    console.log('Updated policies.status enum');
  } catch (err) {
    console.error(err);
  }

  try {
    await connection.query('ALTER TABLE leads ADD COLUMN converted_policy_number VARCHAR(50) DEFAULT NULL');
    console.log('Added converted_policy_number column');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('leads.converted_policy_number already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await connection.query('ALTER TABLE policies ADD COLUMN is_renewal BOOLEAN DEFAULT FALSE');
    console.log('Added is_renewal column');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await connection.query('ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1');
    console.log('Added is_active column');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('users.is_active already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await connection.query('ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL');
    console.log('Added last_login_at column');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('users.last_login_at already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'general',
        description VARCHAR(255) DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Ensured app_settings table exists');
  } catch (err) {
    console.error(err);
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_id INT DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) DEFAULT NULL,
        details JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Ensured audit_logs table exists');
  } catch (err) {
    console.error(err);
  }

  try {
    await connection.query(
      `INSERT INTO app_settings (setting_key, setting_value, category, description, updated_by)
       VALUES
       ('support_email', 'support@insureflow.com', 'company', 'Primary support contact for the software', 1),
       ('renewal_alert_days', '30', 'workflow', 'Days before expiry when renewal alerts should trigger', 1),
       ('maintenance_mode', 'off', 'system', 'Turn on to show maintenance mode messaging', 1)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), category = VALUES(category), description = VALUES(description), updated_by = VALUES(updated_by)`
    );
    console.log('Seeded default app settings');
  } catch (err) {
    console.error(err);
  }

  connection.end();
}

run();
