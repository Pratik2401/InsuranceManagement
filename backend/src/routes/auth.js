const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Brevo = require('@getbrevo/brevo');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ─── Helper: Generate 6-digit OTP ───────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Helper: Send OTP email via Brevo ───────────────────────────────────────
const sendOTPEmail = async (toEmail, otp) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: 'InsureFlow',
    email: process.env.BREVO_SENDER_EMAIL,
  };
  sendSmtpEmail.to = [{ email: toEmail }];
  sendSmtpEmail.subject = 'InsureFlow – Password Reset OTP';
  sendSmtpEmail.htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#1e1f26;padding:32px;border-radius:16px;color:#e2e2eb;">
      <h2 style="color:#c3c0ff;margin-bottom:8px;">Password Reset</h2>
      <p style="color:#c7c4d8;margin-bottom:24px;">Use the OTP below to reset your InsureFlow password. It expires in 10 minutes.</p>
      <div style="background:#282a30;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#c3c0ff;">
        ${otp}
      </div>
      <p style="color:#918fa1;font-size:12px;margin-top:24px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === 'admin' ? 'admin' : 'agent';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    const token = jwt.sign(
      { id: result.insertId, name, email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, name, email, role: userRole },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    // Always respond generically to prevent user enumeration
    if (rows.length === 0) {
      return res.json({ message: 'If this email is registered, you will receive an OTP.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous tokens for this email
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE email = ?', [email]);

    await pool.query(
      'INSERT INTO password_reset_tokens (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Send OTP via Brevo (falls back to console log if API key not configured)
    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
      await sendOTPEmail(email, otp);
    } else {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'If this email is registered, you will receive an OTP.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const [rows] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.json({ message: 'OTP verified successfully.', valid: true });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── POST /api/auth/reset-password ──────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE email = ?', [email]);

    res.json({ message: 'Password reset successfully. Please login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── GET /api/auth/me (Protected) ───────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
