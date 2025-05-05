const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual key

router.post('/', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ success: false, message: 'Image data is required' });

  try {
    const prompt = `Extract all items and their prices from this receipt image...`; // Use your full prompt here
    const data = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: image } }
        ]
      }]
    };

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    const transactions = JSON.parse(text);

    // Map category names to IDs and insert into DB as needed
    // ... (see your PHP logic for mapping and insertion)

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing receipt', error: err.message });
  }
});

module.exports = router;
