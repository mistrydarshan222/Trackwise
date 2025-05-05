const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for multer
const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed'));
    }
  }
});

// GET /receipts
router.get('/', async (req, res) => {
  try {
    const [receipts] = await pool.query(`
      SELECT 
        r.*,
        DATE_FORMAT(r.upload_date, '%Y-%m-%d') as date,
        COALESCE(t.amount, 0) as amount,
        COALESCE(t.merchant, 'Not Processed') as merchant,
        CASE 
          WHEN t.id IS NOT NULL THEN 'Processed'
          ELSE 'Pending'
        END as status
      FROM receipts r
      LEFT JOIN transactions t ON r.id = t.receipt_id
      ORDER BY r.upload_date DESC
    `);
    res.json({ success: true, receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching receipts: ' + err.message });
  }
});

// POST /receipts/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded or upload error occurred' });
  }

  try {
    // Insert receipt record into database
    const [result] = await pool.execute(
      `INSERT INTO receipts (filename, original_name, file_type, file_size, upload_date)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      ]
    );
    const receipt_id = result.insertId;

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receipt_id,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading receipt',
      error: err.message
    });
  }
});

module.exports = router;
