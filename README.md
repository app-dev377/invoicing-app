# InvoiceHub - Modern Invoicing Application

A full-stack invoicing application built with React and Flask, featuring a beautiful modern UI and comprehensive invoice management capabilities.

## Features

✨ **Core Features:**
- 📊 Dashboard with real-time statistics
- 📝 Create, edit, and delete invoices
- 👥 Manage clients and their information
- 📄 Generate PDF invoices
- 💰 Track payment status (Pending, Paid, Overdue)
- 🧮 Automatic calculation of subtotals, taxes, and totals
- 📅 Due date tracking

## Tech Stack

**Frontend:**
- React 18
- React Router for navigation
- Axios for API calls
- Modern CSS with responsive design
- date-fns for date formatting

**Backend:**
- Python Flask
- Flask-SQLAlchemy (SQLite database)
- Flask-CORS for cross-origin requests
- ReportLab for PDF generation

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the Flask backend:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

### Getting Started

1. **Create Clients**: Navigate to the Clients page and add your clients with their contact information.

2. **Create Invoices**: Go to the Invoices page and create new invoices:
   - Select a client
   - Add invoice items (description, quantity, unit price)
   - Set tax rate if applicable
   - Add notes or payment terms
   - Set invoice status

3. **Generate PDFs**: Click the "PDF" button on any invoice to download a professional PDF invoice.

4. **Track Status**: Monitor invoice status from the dashboard:
   - Pending: Awaiting payment
   - Paid: Payment received
   - Overdue: Past due date

### Dashboard

The dashboard provides an overview of your business:
- Total number of invoices and clients
- Count of pending and paid invoices
- Total revenue and pending amounts

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `GET /api/clients/<id>` - Get a specific client
- `PUT /api/clients/<id>` - Update a client
- `DELETE /api/clients/<id>` - Delete a client

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/<id>` - Get a specific invoice
- `PUT /api/invoices/<id>` - Update an invoice
- `DELETE /api/invoices/<id>` - Delete an invoice
- `GET /api/invoices/<id>/pdf` - Download invoice as PDF

### Statistics
- `GET /api/stats` - Get dashboard statistics

## Database Schema

### Client
- id (Primary Key)
- name
- email
- address
- phone
- created_at

### Invoice
- id (Primary Key)
- invoice_number (Unique)
- client_id (Foreign Key)
- issue_date
- due_date
- status (pending/paid/overdue)
- notes
- subtotal
- tax_rate
- total
- created_at

### InvoiceItem
- id (Primary Key)
- invoice_id (Foreign Key)
- description
- quantity
- unit_price
- amount

## Project Structure

```
/workspace
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── public/
│   └── index.html        # HTML template
└── src/
    ├── index.js          # React entry point
    ├── index.css         # Global styles
    ├── App.js            # Main React component
    ├── api.js            # API client functions
    └── pages/
        ├── Dashboard.js      # Dashboard page
        ├── Invoices.js       # Invoice list page
        ├── InvoiceForm.js    # Invoice create/edit form
        ├── Clients.js        # Client list page
        └── ClientForm.js     # Client create/edit form
```

## Development

The application runs in development mode with:
- Hot reload for frontend changes
- Flask debug mode for backend
- CORS enabled for cross-origin requests

## Production Deployment

For production deployment:

1. Build the React frontend:
```bash
npm run build
```

2. Configure Flask to serve the built files or use a separate web server

3. Use a production-grade database (PostgreSQL, MySQL)

4. Set up proper environment variables

5. Disable Flask debug mode

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own invoicing needs!

---

**Enjoy managing your invoices with InvoiceHub! 🚀**
