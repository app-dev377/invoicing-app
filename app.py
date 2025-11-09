from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import os
import io

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///invoicing.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text)
    phone = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    invoices = db.relationship('Invoice', backref='client', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'address': self.address,
            'phone': self.phone,
            'created_at': self.created_at.isoformat()
        }

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    issue_date = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue
    notes = db.Column(db.Text)
    subtotal = db.Column(db.Float, default=0.0)
    tax_rate = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'client_id': self.client_id,
            'client': self.client.to_dict() if self.client else None,
            'issue_date': self.issue_date.isoformat(),
            'due_date': self.due_date.isoformat(),
            'status': self.status,
            'notes': self.notes,
            'subtotal': self.subtotal,
            'tax_rate': self.tax_rate,
            'total': self.total,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class InvoiceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'amount': self.amount
        }

# Initialize database
with app.app_context():
    db.create_all()

# API Routes - Clients
@app.route('/api/clients', methods=['GET'])
def get_clients():
    clients = Client.query.all()
    return jsonify([client.to_dict() for client in clients])

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.json
    client = Client(
        name=data['name'],
        email=data['email'],
        address=data.get('address', ''),
        phone=data.get('phone', '')
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client.to_dict()), 201

@app.route('/api/clients/<int:id>', methods=['GET'])
def get_client(id):
    client = Client.query.get_or_404(id)
    return jsonify(client.to_dict())

@app.route('/api/clients/<int:id>', methods=['PUT'])
def update_client(id):
    client = Client.query.get_or_404(id)
    data = request.json
    client.name = data.get('name', client.name)
    client.email = data.get('email', client.email)
    client.address = data.get('address', client.address)
    client.phone = data.get('phone', client.phone)
    db.session.commit()
    return jsonify(client.to_dict())

@app.route('/api/clients/<int:id>', methods=['DELETE'])
def delete_client(id):
    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    return '', 204

# API Routes - Invoices
@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify([invoice.to_dict() for invoice in invoices])

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    data = request.json
    
    # Calculate totals
    subtotal = sum(item['quantity'] * item['unit_price'] for item in data['items'])
    tax_rate = data.get('tax_rate', 0.0)
    total = subtotal * (1 + tax_rate / 100)
    
    invoice = Invoice(
        invoice_number=data['invoice_number'],
        client_id=data['client_id'],
        issue_date=datetime.fromisoformat(data['issue_date']),
        due_date=datetime.fromisoformat(data['due_date']),
        status=data.get('status', 'pending'),
        notes=data.get('notes', ''),
        subtotal=subtotal,
        tax_rate=tax_rate,
        total=total
    )
    
    for item_data in data['items']:
        item = InvoiceItem(
            description=item_data['description'],
            quantity=item_data['quantity'],
            unit_price=item_data['unit_price'],
            amount=item_data['quantity'] * item_data['unit_price']
        )
        invoice.items.append(item)
    
    db.session.add(invoice)
    db.session.commit()
    return jsonify(invoice.to_dict()), 201

@app.route('/api/invoices/<int:id>', methods=['GET'])
def get_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    return jsonify(invoice.to_dict())

@app.route('/api/invoices/<int:id>', methods=['PUT'])
def update_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    data = request.json
    
    # Update basic fields
    invoice.invoice_number = data.get('invoice_number', invoice.invoice_number)
    invoice.client_id = data.get('client_id', invoice.client_id)
    invoice.issue_date = datetime.fromisoformat(data['issue_date']) if 'issue_date' in data else invoice.issue_date
    invoice.due_date = datetime.fromisoformat(data['due_date']) if 'due_date' in data else invoice.due_date
    invoice.status = data.get('status', invoice.status)
    invoice.notes = data.get('notes', invoice.notes)
    invoice.tax_rate = data.get('tax_rate', invoice.tax_rate)
    
    # Update items if provided
    if 'items' in data:
        # Remove old items
        InvoiceItem.query.filter_by(invoice_id=id).delete()
        
        # Add new items
        subtotal = 0
        for item_data in data['items']:
            item = InvoiceItem(
                invoice_id=id,
                description=item_data['description'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                amount=item_data['quantity'] * item_data['unit_price']
            )
            subtotal += item.amount
            db.session.add(item)
        
        invoice.subtotal = subtotal
        invoice.total = subtotal * (1 + invoice.tax_rate / 100)
    
    db.session.commit()
    return jsonify(invoice.to_dict())

@app.route('/api/invoices/<int:id>', methods=['DELETE'])
def delete_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    db.session.delete(invoice)
    db.session.commit()
    return '', 204

@app.route('/api/invoices/<int:id>/pdf', methods=['GET'])
def download_invoice_pdf(id):
    invoice = Invoice.query.get_or_404(id)
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b>INVOICE #{invoice.invoice_number}</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Client info
    client_info = Paragraph(f"""
        <b>Bill To:</b><br/>
        {invoice.client.name}<br/>
        {invoice.client.email}<br/>
        {invoice.client.address or ''}<br/>
        {invoice.client.phone or ''}
    """, styles['Normal'])
    elements.append(client_info)
    elements.append(Spacer(1, 0.3*inch))
    
    # Invoice details
    details = Paragraph(f"""
        <b>Issue Date:</b> {invoice.issue_date.strftime('%Y-%m-%d')}<br/>
        <b>Due Date:</b> {invoice.due_date.strftime('%Y-%m-%d')}<br/>
        <b>Status:</b> {invoice.status.upper()}
    """, styles['Normal'])
    elements.append(details)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items table
    table_data = [['Description', 'Quantity', 'Unit Price', 'Amount']]
    for item in invoice.items:
        table_data.append([
            item.description,
            str(item.quantity),
            f"${item.unit_price:.2f}",
            f"${item.amount:.2f}"
        ])
    
    table_data.append(['', '', 'Subtotal:', f"${invoice.subtotal:.2f}"])
    table_data.append(['', '', f'Tax ({invoice.tax_rate}%):', f"${(invoice.total - invoice.subtotal):.2f}"])
    table_data.append(['', '', 'Total:', f"${invoice.total:.2f}"])
    
    table = Table(table_data, colWidths=[3.5*inch, 1*inch, 1.2*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -4), colors.beige),
        ('GRID', (0, 0), (-1, -4), 1, colors.black),
        ('FONTNAME', (2, -3), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    
    if invoice.notes:
        elements.append(Spacer(1, 0.3*inch))
        notes = Paragraph(f"<b>Notes:</b><br/>{invoice.notes}", styles['Normal'])
        elements.append(notes)
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"invoice_{invoice.invoice_number}.pdf",
        mimetype='application/pdf'
    )

# Dashboard stats
@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_invoices = Invoice.query.count()
    total_clients = Client.query.count()
    pending_invoices = Invoice.query.filter_by(status='pending').count()
    paid_invoices = Invoice.query.filter_by(status='paid').count()
    total_revenue = db.session.query(db.func.sum(Invoice.total)).filter_by(status='paid').scalar() or 0
    pending_amount = db.session.query(db.func.sum(Invoice.total)).filter_by(status='pending').scalar() or 0
    
    return jsonify({
        'total_invoices': total_invoices,
        'total_clients': total_clients,
        'pending_invoices': pending_invoices,
        'paid_invoices': paid_invoices,
        'total_revenue': round(total_revenue, 2),
        'pending_amount': round(pending_amount, 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
