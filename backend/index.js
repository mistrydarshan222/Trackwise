const express = require('express');
const app = express();
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const historyRouter = require('./routes/history');
const receiptsRouter = require('./routes/receipts');
const processReceiptRouter = require('./routes/process_receipt');
const processReceiptGeminiRouter = require('./routes/process_receipt_gemini');
const processImageRouter = require('./routes/process_image');


app.use(express.json());

// Use the transactions router for /transactions endpoints
app.use('/transactions', transactionsRouter);
app.use('/categories', categoriesRouter);
app.use('/history', historyRouter);
app.use('/receipts', receiptsRouter);
app.use('/process_receipt', processReceiptRouter);
app.use('/process_receipt_gemini', processReceiptGeminiRouter);
app.use('/process_image', processImageRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));