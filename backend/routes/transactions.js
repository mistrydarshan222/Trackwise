const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if your db.js is elsewhere

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.is_deleted = 0
      ORDER BY t.date DESC
    `);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching transactions: ' + err.message });
  }
});

// Add a new transaction
router.post('/', async (req, res) => {
    const { description, amount, category_id, date } = req.body;
    if (!description || description.length < 3) return res.status(400).json({ success: false, message: 'Description must be at least 3 characters long' });
    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    if (!category_id || isNaN(category_id)) return res.status(400).json({ success: false, message: 'Invalid category ID' });
    if (!date || isNaN(Date.parse(date))) return res.status(400).json({ success: false, message: 'Invalid date format' });
  
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
  
      // Check if category exists
      const [catRows] = await conn.execute('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (catRows.length === 0) throw new Error('Category not found');
  
      // Insert transaction
      const [result] = await conn.execute(
        'INSERT INTO transactions (description, amount, category_id, date) VALUES (?, ?, ?, ?)',
        [description, amount, category_id, date]
      );
      const transaction_id = result.insertId;
  
      await conn.commit();
      res.json({ success: true, message: 'Transaction added successfully', transaction_id });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ success: false, message: err.message });
    } finally {
      conn.release();
    }
  });
  
  // Soft delete a transaction
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
  
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
  
      // Get transaction details
      const [rows] = await conn.execute(
        'SELECT amount, category_id FROM transactions WHERE id = ? AND is_deleted = 0',
        [id]
      );
      if (rows.length === 0) throw new Error('Transaction not found or already deleted');
      const { amount, category_id } = rows[0];
  
      // Soft delete
      await conn.execute(
        'UPDATE transactions SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
  
      await conn.commit();
      res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ success: false, error: err.message });
    } finally {
      conn.release();
    }
  });

  // Batch add transactions
router.post('/batch', async (req, res) => {
    const { transactions, receipt_id } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0 || !receipt_id) {
      return res.status(400).json({ success: false, message: 'Missing or invalid transactions or receipt_id' });
    }
  
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
  
      let processed = 0, failed = 0;
      const results = [];
  
      for (let [index, transaction] of transactions.entries()) {
        try {
          // Validate transaction data
          if (!transaction.description || transaction.description.length < 3) throw new Error('Description must be at least 3 characters');
          if (!transaction.amount || isNaN(transaction.amount) || transaction.amount <= 0) throw new Error('Amount must be a positive number');
          if (!transaction.category_id || isNaN(transaction.category_id)) throw new Error('Valid category ID is required');
  
          // Check if category exists
          const [catRows] = await conn.execute('SELECT id FROM categories WHERE id = ?', [transaction.category_id]);
          if (catRows.length === 0) throw new Error('Category not found');
  
          // Insert transaction
          const [result] = await conn.execute(
            'INSERT INTO transactions (description, amount, category_id, date, receipt_id) VALUES (?, ?, ?, ?, ?)',
            [
              transaction.description,
              transaction.amount,
              transaction.category_id,
              transaction.date || new Date(),
              receipt_id
            ]
          );
          const transaction_id = result.insertId;
  
          results.push({ index, success: true, transaction_id });
          processed++;
        } catch (err) {
          results.push({ index, success: false, error: err.message });
          failed++;
        }
      }
  
      if (processed === 0) throw new Error('All transactions failed to process');
  
      await conn.commit();
      res.json({
        success: true,
        message: 'Batch transactions processed successfully',
        processed,
        failed,
        transactions: results
      });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ success: false, message: 'Error processing batch transactions', error: err.message });
    } finally {
      conn.release();
    }
  });

  // Restore a soft-deleted transaction
    router.post('/restore', async (req, res) => {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, error: 'Transaction ID is required' });
    
        const conn = await pool.getConnection();
        try {
        await conn.beginTransaction();
    
        // Get transaction details
        const [rows] = await conn.execute(
            'SELECT * FROM transactions WHERE id = ? AND is_deleted = 1',
            [id]
        );
        if (rows.length === 0) throw new Error('Transaction not found or not deleted');
        const transaction = rows[0];
    
        // Restore transaction
        await conn.execute(
            'UPDATE transactions SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    
        // Update category total
        await conn.execute(
            'UPDATE categories SET total_amount = total_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [transaction.amount, transaction.category_id]
        );
    
        // Add to history
        await conn.execute(
            `INSERT INTO transaction_history (
            transaction_id, action, description, amount, category_id, date, changed_at, changed_by
            ) VALUES (?, 'restore', ?, ?, ?, ?, CURRENT_TIMESTAMP, 'system')`,
            [
            id,
            transaction.description,
            transaction.amount,
            transaction.category_id,
            transaction.date
            ]
        );
    
        await conn.commit();
        res.json({ success: true, message: 'Transaction restored successfully', transaction });
        } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, error: err.message });
        } finally {
        conn.release();
        }
    });

    // ... existing code ...
// Restore a soft-deleted transaction
router.post('/restore', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Transaction ID is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get transaction details
    const [rows] = await conn.execute(
      'SELECT * FROM transactions WHERE id = ? AND is_deleted = 1',
      [id]
    );
    if (rows.length === 0) throw new Error('Transaction not found or not deleted');
    const transaction = rows[0];

    // Restore transaction
    await conn.execute(
      'UPDATE transactions SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Update category total
    await conn.execute(
      'UPDATE categories SET total_amount = total_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [transaction.amount, transaction.category_id]
    );

    // Add to history
    await conn.execute(
      `INSERT INTO transaction_history (
        transaction_id, action, description, amount, category_id, date, changed_at, changed_by
      ) VALUES (?, 'restore', ?, ?, ?, ?, CURRENT_TIMESTAMP, 'system')`,
      [
        id,
        transaction.description,
        transaction.amount,
        transaction.category_id,
        transaction.date
      ]
    );

    await conn.commit();
    res.json({ success: true, message: 'Transaction restored successfully', transaction });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});


module.exports = router;