# Sales & Warehouse Management System

A comprehensive full-stack application for managing sales orders, purchase orders, inventory, and customer relationships for businesses.

## 📋 Features

- **Customer Management**: Manage business customers, contact details, and credit limits
- **Product Management**: Organize products, categories, pricing, and inventory levels
- **Sales Orders**: Create and track sales orders with automatic inventory updates
- **Purchase Orders**: Manage supplier orders and track deliveries
- **Inventory Management**: Real-time inventory tracking with warehouse locations
- **User Authentication**: Secure login with role-based access control
- **Dashboard**: Executive overview with key metrics and statistics

## 🏗️ Tech Stack

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### Frontend
- **Framework**: React 18
- **UI Library**: Ant Design
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6

## 📁 Project Structure

```
sales-warehouse-management/
├── backend/
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── migrations/      # Database migrations
│   │   └── index.js         # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # Reusable components
│   │   ├── api/             # API client setup
│   │   ├── store/           # Zustand state management
│   │   ├── layout/          # Layout components
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env if needed
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Customer Endpoints
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory Endpoints
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/:id` - Get inventory by ID
- `PUT /api/inventory/:id` - Update inventory

### Sales Order Endpoints
- `GET /api/sales-orders` - Get all sales orders
- `GET /api/sales-orders/:id` - Get sales order by ID
- `POST /api/sales-orders` - Create new sales order
- `PUT /api/sales-orders/:id` - Update sales order

### Purchase Order Endpoints
- `GET /api/purchase-orders` - Get all purchase orders
- `GET /api/purchase-orders/:id` - Get purchase order by ID
- `POST /api/purchase-orders` - Create new purchase order
- `PUT /api/purchase-orders/:id` - Update purchase order

## 🔐 Default Credentials

For development, you can create a test user:

```bash
# Email: test@example.com
# Password: password123
```

## 📝 Database Setup

Create a PostgreSQL database and tables:

```sql
CREATE DATABASE sales_warehouse_db;
```

The tables will be automatically created when the backend server starts.

## 🛠️ Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 📄 License

MIT License - feel free to use this for commercial purposes.

## 🤝 Support

For issues or questions, please contact the development team.
