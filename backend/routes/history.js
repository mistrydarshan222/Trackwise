const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get transaction history (last 100 changes)
router.get('/', async (req, res) => {
  try {
    const [history] = await pool.query(`
      SELECT h.*, c.name as category_name
      FROM transaction_history h
      JOIN categories c ON h.category_id = c.id
      ORDER BY h.changed_at DESC
      LIMIT 100
    `);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching transaction history: ' + err.message });
  }
});

module.exports = router;
