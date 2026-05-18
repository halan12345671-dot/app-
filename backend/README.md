# Backend API - Sales & Warehouse Management System

## Overview
RESTful API built with Express.js and Sequelize ORM for the Sales and Warehouse Management System.

## Getting Started

### Installation
```bash
npm install
```

### Configuration
1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_warehouse_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## Database Setup

### PostgreSQL Connection
1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE sales_warehouse_db;
```

3. The backend will automatically create tables on first startup

## API Documentation

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "staff"
  }
}
```

### Customers

#### Get All Customers
```
GET /api/customers
Authorization: Bearer {token}
```

#### Get Customer by ID
```
GET /api/customers/{id}
Authorization: Bearer {token}
```

#### Create Customer
```
POST /api/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "ABC Corp",
  "contact_person": "John Smith",
  "email": "john@abccorp.com",
  "phone": "+1-555-1234",
  "address": "123 Business St",
  "city": "New York",
  "country": "USA",
  "tax_id": "TAX123",
  "credit_limit": 50000
}
```

#### Update Customer
```
PUT /api/customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "Updated Name",
  ...
}
```

#### Delete Customer
```
DELETE /api/customers/{id}
Authorization: Bearer {token}
```

### Products

#### Get All Products
```
GET /api/products
Authorization: Bearer {token}
```

#### Create Product
```
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "PROD001",
  "name": "Product Name",
  "description": "Product description",
  "category": "Electronics",
  "unit_price": 99.99,
  "cost_price": 50.00,
  "unit": "piece",
  "reorder_level": 10
}
```

### Sales Orders

#### Get All Sales Orders
```
GET /api/sales-orders
Authorization: Bearer {token}
```

#### Create Sales Order
```
POST /api/sales-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_number": "SO-001",
  "customer_id": "customer-uuid",
  "due_date": "2026-06-11",
  "total_amount": 1500.00,
  "tax_amount": 150.00,
  "discount_amount": 50.00,
  "notes": "Special order"
}
```

### Purchase Orders

#### Get All Purchase Orders
```
GET /api/purchase-orders
Authorization: Bearer {token}
```

#### Create Purchase Order
```
POST /api/purchase-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "po_number": "PO-001",
  "supplier_name": "Supplier ABC",
  "expected_delivery_date": "2026-05-25",
  "total_amount": 5000.00,
  "tax_amount": 500.00,
  "notes": "Rush order"
}
```

### Inventory

#### Get All Inventory
```
GET /api/inventory
Authorization: Bearer {token}
```

#### Update Inventory
```
PUT /api/inventory/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity_on_hand": 100,
  "quantity_reserved": 10,
  "quantity_available": 90,
  "warehouse_location": "A-1-5"
}
```

## Models

### User
- id (UUID)
- email (String, unique)
- password (String, hashed)
- first_name (String)
- last_name (String)
- role (Enum: admin, manager, staff)
- is_active (Boolean)
- created_at (DateTime)
- updated_at (DateTime)

### Customer
- id (UUID)
- company_name (String)
- contact_person (String)
- email (String)
- phone (String)
- address (Text)
- city (String)
- country (String)
- tax_id (String)
- credit_limit (Decimal)
- status (Enum: active, inactive, suspended)
- created_at (DateTime)
- updated_at (DateTime)

### Product
- id (UUID)
- sku (String, unique)
- name (String)
- description (Text)
- category (String)
- unit_price (Decimal)
- cost_price (Decimal)
- unit (String)
- reorder_level (Integer)
- status (Enum: active, inactive, discontinued)
- created_at (DateTime)
- updated_at (DateTime)

### SalesOrder
- id (UUID)
- order_number (String, unique)
- customer_id (UUID, FK)
- order_date (DateTime)
- due_date (DateTime)
- status (Enum: pending, confirmed, shipped, delivered, cancelled)
- total_amount (Decimal)
- tax_amount (Decimal)
- discount_amount (Decimal)
- notes (Text)
- created_at (DateTime)
- updated_at (DateTime)

### PurchaseOrder
- id (UUID)
- po_number (String, unique)
- supplier_name (String)
- po_date (DateTime)
- expected_delivery_date (DateTime)
- status (Enum: draft, sent, received, cancelled)
- total_amount (Decimal)
- tax_amount (Decimal)
- notes (Text)
- created_at (DateTime)
- updated_at (DateTime)

### Inventory
- id (UUID)
- product_id (UUID, FK)
- quantity_on_hand (Integer)
- quantity_reserved (Integer)
- quantity_available (Integer)
- warehouse_location (String)
- last_counted_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error Response Format:
```json
{
  "message": "Error description",
  "status": 400
}
```

## Testing

```bash
npm test
```

## License

MIT
