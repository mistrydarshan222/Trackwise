const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching categories: ' + err.message });
  }
});

// Create new category
router.post('/', async (req, res) => {
  const { name } = req.body;

  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );
    
    const [newCategory] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully',
      category: newCategory[0]
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating category: ' + err.message 
    });
  }
});

// Get category summary (total amount per category)
router.get('/summary', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          c.id,
          c.name,
          SUM(t.amount) AS total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        GROUP BY c.id
        ORDER BY total DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;