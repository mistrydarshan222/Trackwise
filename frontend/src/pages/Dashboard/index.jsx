// src/pages/Dashboard.jsx
import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import ExpenseChart from '../../components/ExpenseChart';
import useDashboardData from '../../hooks/useDashboardData';

const Dashboard = () => {
  const { data, loading, error } = useDashboardData();

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="h6" color="text.secondary">
                  Total Expenses
                </Typography>
                <Typography variant="h4">
                  ${data.summary.totalExpenses.toLocaleString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="h6" color="text.secondary">
                  This Month
                </Typography>
                <Typography variant="h4">
                  ${data.summary.monthlyExpenses.toLocaleString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="h6" color="text.secondary">
                  Categories
                </Typography>
                <Typography variant="h4">
                  {data.summary.categoryCount}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="h6" color="text.secondary">
                  Receipts
                </Typography>
                <Typography variant="h4">
                  {data.summary.receiptCount}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <ExpenseChart 
        monthlyData={data.monthlyData}
        categoryData={data.categoryData}
        loading={loading}
      />
    </Box>
  );
};

export default Dashboard;