import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, deleteClient } from '../api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading clients:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      try {
        await deleteClient(id);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client. They may have associated invoices.');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Clients</h1>
        <Link to="/clients/new" className="btn btn-primary">+ Add New Client</Link>
      </div>

      <div className="card">
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No clients yet</h3>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>
              Create your first client to get started!
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td><strong>{client.name}</strong></td>
                    <td>{client.email}</td>
                    <td>{client.phone || '-'}</td>
                    <td>{client.address || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/clients/edit/${client.id}`} className="btn btn-secondary btn-small">
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(client.id, client.name)} 
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

export default Clients;
