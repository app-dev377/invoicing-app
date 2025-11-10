import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClients, getInvoice, createInvoice, updateInvoice } from '../api';
import { format } from 'date-fns';

function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    client_id: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'pending',
    tax_rate: 0,
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    loadClients();
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadInvoice = async () => {
    try {
      const response = await getInvoice(id);
      const invoice = response.data;
      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        issue_date: invoice.issue_date.split('T')[0],
        due_date: invoice.due_date.split('T')[0],
        status: invoice.status,
        tax_rate: invoice.tax_rate,
        notes: invoice.notes || '',
        items: invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, unit_price: 0 }]
      });
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Failed to load invoice');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (parseFloat(formData.tax_rate) || 0) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].description) {
      alert('Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        issue_date: new Date(formData.issue_date).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        client_id: parseInt(formData.client_id),
        tax_rate: parseFloat(formData.tax_rate) || 0,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      if (id) {
        await updateInvoice(id, submitData);
      } else {
        await createInvoice(submitData);
      }
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>
        {id ? 'Edit Invoice' : 'New Invoice'}
      </h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Invoice Number *</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Client *</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Issue Date *</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="invoice-items">
            <h3 style={{ marginBottom: '1rem' }}>Invoice Items</h3>
            {formData.items.map((item, index) => (
              <div key={index} className="invoice-item">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Description *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Unit Price *</label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Amount</label>
                  <input
                    type="text"
                    value={`$${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}`}
                    disabled
                  />
                </div>

                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn btn-danger btn-small"
                    style={{ marginTop: '1.5rem' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              + Add Item
            </button>
          </div>

          <div className="invoice-summary">
            <div>Subtotal: <strong>${calculateSubtotal().toFixed(2)}</strong></div>
            <div>Tax ({formData.tax_rate}%): <strong>${calculateTax().toFixed(2)}</strong></div>
            <div className="total">Total: ${calculateTotal().toFixed(2)}</div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes or payment terms..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update Invoice' : 'Create Invoice'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/invoices')} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceForm;
