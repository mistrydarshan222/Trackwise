import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Grid
} from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import api from '../../services/api';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data.receipts);
      setError(null);
    } catch (err) {
      setError('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      setUploading(true);
      const response = await api.post('/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setOcrResult(response.data);
      setOpen(true);
    } catch (err) {
      setError('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await api.delete(`/receipts/${id}`);
        fetchReceipts();
      } catch (err) {
        setError('Failed to delete receipt');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Receipts</Typography>
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="receipt-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="receipt-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Receipt'}
            </Button>
          </label>
          {selectedFile && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              sx={{ ml: 2 }}
              disabled={uploading}
            >
              Process Receipt
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                <TableCell>{receipt.merchant}</TableCell>
                <TableCell>${receipt.amount.toLocaleString()}</TableCell>
                <TableCell>{receipt.status}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDelete(receipt.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receipt Details</DialogTitle>
        <DialogContent>
          {ocrResult && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <img
                  src={ocrResult.image_url}
                  alt="Receipt"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Extracted Information</Typography>
                <Typography>Merchant: {ocrResult.merchant}</Typography>
                <Typography>Date: {new Date(ocrResult.date).toLocaleDateString()}</Typography>
                <Typography>Amount: ${ocrResult.amount.toLocaleString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
