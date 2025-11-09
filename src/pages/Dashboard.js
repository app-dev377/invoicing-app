import React, { useState, useEffect } from 'react';
import { getStats } from '../api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getStats();
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Invoices</h3>
          <div className="value">{stats?.total_invoices || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Clients</h3>
          <div className="value">{stats?.total_clients || 0}</div>
        </div>
        
        <div className="stat-card">
          <h3>Pending Invoices</h3>
          <div className="value" style={{ color: '#f59e0b' }}>
            {stats?.pending_invoices || 0}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Paid Invoices</h3>
          <div className="value" style={{ color: '#10b981' }}>
            {stats?.paid_invoices || 0}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="value" style={{ color: '#10b981' }}>
            ${stats?.total_revenue?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Pending Amount</h3>
          <div className="value" style={{ color: '#f59e0b' }}>
            ${stats?.pending_amount?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h2>Welcome to InvoiceHub! 🎉</h2>
        <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#6b7280' }}>
          Manage your invoices and clients with ease. Get started by creating your first client or invoice.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
