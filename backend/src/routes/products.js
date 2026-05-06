const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// Protect all routes with authentication middleware and limit to agents
router.use(verifyToken, requireAgent);

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description) VALUES (?, ?)',
      [name, description || '']
    );

    try { await logAudit(req.user?.id, 'product.create', 'product', result.insertId, { name }); } catch (e) {}

    res.status(201).json({ 
      id: result.insertId, 
      name, 
      description 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Product already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update a product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    try { await logAudit(req.user?.id, 'product.update', 'product', id, { name }); } catch (e) {}
    res.json({ id, name, description });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Product name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    try { await logAudit(req.user?.id, 'product.delete', 'product', id); } catch (e) {}
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST bulk products (for imports if needed)
router.post('/bulk', async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty products array.' });
    }

    const insertQuery = `
      INSERT INTO products (name, description)
      VALUES ?
      ON DUPLICATE KEY UPDATE description=VALUES(description)
    `;

    const values = products.map(p => [
      p.name, 
      p.description || ''
    ]);

    const [result] = await pool.query(insertQuery, [values]);
    try { await logAudit(req.user?.id, 'product.bulk_import', 'product', null, { count: products.length }); } catch (e) {}
    res.status(201).json({ message: 'Products imported successfully', count: result.affectedRows });
  } catch (error) {
    console.error('Error bulk creating products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
