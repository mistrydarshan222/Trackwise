const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    console.log('Fetching dashboard summary...');
    const [totalExpenses] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions'
    );

    const [monthlyExpenses] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())'
    );

    const [categoryCount] = await pool.query(
      'SELECT COUNT(*) as count FROM categories'
    );

    const [receiptCount] = await pool.query(
      'SELECT COUNT(*) as count FROM receipts'
    );

    res.json({
      totalExpenses: totalExpenses[0].total,
      monthlyExpenses: monthlyExpenses[0].total,
      categoryCount: categoryCount[0].count,
      receiptCount: receiptCount[0].count
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    
  }
});

// Get monthly expense data
router.get('/monthly', async (req, res) => {
  try {
    const [monthlyData] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%b') as month,
        COALESCE(SUM(amount), 0) as amount
      FROM transactions
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY YEAR(date), MONTH(date)
    `);

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// Get category distribution data
router.get('/categories', async (req, res) => {
  try {
    const [categoryData] = await pool.query(`
      SELECT 
        c.name,
        COALESCE(SUM(t.amount), 0) as value
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id, c.name
      HAVING value > 0
    `);

    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
});

module.exports = router; 