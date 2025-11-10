import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices, deleteInvoice, downloadInvoicePDF } from '../api';
import { format } from 'date-fns';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await getInvoices();
      setInvoices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to delete invoice #${invoiceNumber}?`)) {
      try {
        await deleteInvoice(id);
        loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Invoices</h1>
        <Link to="/invoices/new" className="btn btn-primary">+ Create Invoice</Link>
      </div>

      <div className="card">
        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No invoices yet</h3>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>
              Create your first invoice to get started!
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoice_number}</strong></td>
                    <td>{invoice.client?.name || 'N/A'}</td>
                    <td>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</td>
                    <td>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</td>
                    <td><strong>${invoice.total.toFixed(2)}</strong></td>
                    <td>
                      <span className={getStatusClass(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => downloadInvoicePDF(invoice.id)}
                          className="btn btn-success btn-small"
                        >
                          PDF
                        </button>
                        <Link to={`/invoices/edit/${invoice.id}`} className="btn btn-secondary btn-small">
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)} 
                          className="btn btn-danger btn-small"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Invoices;
