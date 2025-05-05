import { useState, useEffect } from 'react';
import axios from 'axios';

const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {
      totalExpenses: 0,
      monthlyExpenses: 0,
      categoryCount: 0,
      receiptCount: 0
    },
    monthlyData: [],
    categoryData: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, monthlyRes, categoryRes] = await Promise.all([
          axios.get('/api/dashboard/summary'),
          axios.get('/api/dashboard/monthly'),
          axios.get('/api/dashboard/categories')
        ]);

        setData({
          summary: summaryRes.data,
          monthlyData: monthlyRes.data,
          categoryData: categoryRes.data
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, loading, error };
};

export default useDashboardData; 