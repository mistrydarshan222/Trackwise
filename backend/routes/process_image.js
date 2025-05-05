const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const GEMINI_API_KEY = 'AIzaSyAxr4MUhhtnSmbF4EhfSP0rhjzVnNSY1dA'; // Replace with your actual key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// Multer setup for image upload
const upload = multer({ dest: 'uploads/tmp/' });

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });

  try {
    // Read and encode image
    const imageData = fs.readFileSync(req.file.path, { encoding: 'base64' });
    const mimeType = req.file.mimetype;

    // Prepare Gemini API request
    const prompt = `You are a receipt scanner...`; // Use your full prompt here
    const data = {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageData } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Parse Gemini response
    const candidates = geminiRes.data.candidates;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Unexpected Gemini response');

    // Clean and parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const transactions = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    // Validate and save transactions
    if (!transactions.transactions) throw new Error('No transactions found');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const stmt = await conn.prepare(
        'INSERT INTO transactions (description, amount, category_id, date) VALUES (?, ?, ?, ?)'
      );
      for (const tx of transactions.transactions) {
        await stmt.execute([tx.description, tx.amount, tx.category_id, tx.date]);
      }
      await conn.commit();
      res.json({ success: true, added: transactions.transactions.length });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlinkSync(req.file.path); // Clean up temp file
  }
});

module.exports = router;
