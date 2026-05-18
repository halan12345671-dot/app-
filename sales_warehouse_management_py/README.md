# Sales & Warehouse Management System - Python/FastAPI Version

This is the Python/FastAPI implementation of the Sales & Warehouse Management System with advanced features including:
- Enhanced authentication (JWT, OAuth 2.0, Two-Factor Authentication)
- Role-Based Access Control (RBAC)
- Third-party integrations (Payment gateways, Email services, Social login)
- RESTful API compatible with the existing frontend

## Features

### Authentication & Security
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Two-Factor Authentication (TOTP) via Google Authenticator
- OAuth 2.0 support for Google and GitHub login
- Role-Based Access Control (Admin, Manager, Staff)
- Rate limiting on authentication endpoints

### Core Functionality
- Customer Management
- Product Management
- Inventory Management
- Sales Order Management
- Purchase Order Management

### Third-Party Integrations
- **Payment**: Stripe, PayPal
- **Email**: SMTP, SendGrid, AWS SES
- **Social Login**: Google, GitHub

## Getting Started

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Set up the database:
   ```bash
   # Create database
   createdb sales_warehouse_db
   
   # Run migrations
   alembic upgrade head
   ```

### Running the Application

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main URL: http://localhost:8000
- API Documentation: http://localhost:8000/api/v1/docs
- Alternative API Documentation: http://localhost:8000/api/v1/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/mfa/setup` - Setup MFA/2FA
- `POST /api/v1/auth/mfa/verify` - Verify MFA token
- `POST /api/v1/auth/mfa/validate` - Validate MFA with temporary token
- `GET /api/v1/auth/oauth/{provider}` - Initiate OAuth login
- `GET /api/v1/auth/oauth/{provider}/callback` - OAuth callback

### Customer Management
- `GET /api/v1/customers` - Get all customers (paginated)
- `GET /api/v1/customers/{id}` - Get customer by ID
- `POST /api/v1/customers` - Create new customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer

### Product Management
- `GET /api/v1/products` - Get all products (paginated)
- `GET /api/v1/products/{id}` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Inventory Management
- `GET /api/v1/inventory` - Get all inventory (paginated)
- `GET /api/v1/inventory/{id}` - Get inventory item by ID
- `POST /api/v1/inventory` - Create inventory item
- `PUT /api/v1/inventory/{id}` - Update inventory item
- `DELETE /api/v1/inventory/{id}` - Delete inventory item
- `POST /api/v1/inventory/{id}/adjust` - Adjust inventory quantity

### Sales Orders
- `GET /api/v1/sales` - Get all sales orders (paginated)
- `GET /api/v1/sales/{id}` - Get sales order by ID
- `POST /api/v1/sales` - Create new sales order
- `PUT /api/v1/sales/{id}` - Update sales order
- `DELETE /api/v1/sales/{id}` - Delete sales order

### Purchase Orders
- `GET /api/v1/purchases` - Get all purchase orders (paginated)
- `GET /api/v1/purchases/{id}` - Get purchase order by ID
- `POST /api/v1/purchases` - Create new purchase order
- `PUT /api/v1/purchases/{id}` - Update purchase order
- `DELETE /api/v1/purchases/{id}` - Delete purchase order

### Third-Party Integrations
- `POST /api/v1/integrations/payment/process` - Process payment
- `POST /api/v1/integrations/payment/refund` - Refund payment
- `POST /api/v1/integrations/email/send` - Send email
- `POST /api/v1/integrations/email/template` - Send template email
- `GET /api/v1/integrations/oauth/{provider}` - Initiate social login
- `GET /api/v1/integrations/oauth/{provider}/callback` - Social login callback
- `GET /api/v1/integrations/health` - Check integration services health

## Database Models

The system uses SQLAlchemy ORM with PostgreSQL. Key models include:

### User
- id (UUID)
- email (unique)
- password_hash
- first_name, last_name
- role (admin/manager/staff)
- is_active
- mfa_secret (for 2FA)
- mfa_enabled
- created_at, updated_at

### Customer
- id (UUID)
- company_name
- contact_person
- email (unique)
- phone
- address
- city
- country
- tax_id
- credit_limit
- status (active/inactive/suspended)
- created_at, updated_at

### Product
- id (UUID)
- name
- description
- sku (unique)
- price
- category_id
- stock_quantity
- min_stock_level
- is_active
- created_at, updated_at

### Inventory
- id (UUID)
- product_id (FK)
- warehouse_location
- qty_on_hand
- reserved_qty
- reorder_point
- created_at, updated_at

### SalesOrder
- id (UUID)
- customer_id (FK)
- order_date
- status (pending/confirmed/shipped/delivered/cancelled)
- total_amount
- notes
- created_at, updated_at

### PurchaseOrder
- id (UUID)
- supplier_id
- order_date
- status (pending/approved/received/cancelled)
- total_amount
- notes
- created_at, updated_at

## Testing

Run the test suite:
```bash
pytest
```

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Compatibility with Existing Frontend

This API maintains compatibility with the existing React/Ant Design frontend by:
- Using the same endpoint structure as the Node.js version
- Returning data in compatible formats
- Supporting the same authentication flow (JWT tokens)
- Maintaining consistent response structures

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT License