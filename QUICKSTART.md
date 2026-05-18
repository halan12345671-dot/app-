# Quick Start Guide

## Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

## 1. Database Setup

```bash
# Create PostgreSQL database
createdb sales_warehouse_db
```

Or via PostgreSQL GUI:
```sql
CREATE DATABASE sales_warehouse_db;
```

## 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Update DB_PASSWORD, JWT_SECRET, etc.

# Install dependencies (already done)
npm install

# Start server
npm run dev
```

Backend will run at `http://localhost:5000`

## 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies (already done)
npm install

# Start React app
npm start
```

Frontend will open at `http://localhost:3000`

## 4. Test the Application

### Login
- Navigate to http://localhost:3000/login
- The login page is ready (no credentials yet - need to create user via API)

### Create First User (via API or Database)

#### Option A: Via API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

#### Option B: Direct Database
```sql
-- Connect to sales_warehouse_db
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$10$...',  -- bcrypt hashed password
  'Admin',
  'User',
  'admin',
  true,
  NOW(),
  NOW()
);
```

## 5. Key Features

### Dashboard
- View key metrics and statistics
- Monitor inventory levels
- Track active orders

### Customers
- Add/Edit/Delete customers
- Manage contact information
- Set credit limits

### Products
- Catalog management
- Pricing and costs
- Category organization

### Inventory
- Real-time stock levels
- Warehouse locations
- Reserve tracking

### Sales Orders
- Create orders
- Track shipments
- Apply discounts

### Purchase Orders
- Supplier orders
- Delivery tracking
- Cost management

## 6. File Structure

```
sales-warehouse-management/
├── backend/
│   ├── src/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   └── index.js     # Server entry
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── api/         # HTTP client
│   │   ├── store/       # State management
│   │   └── App.js
│   ├── package.json
│   └── .env
└── README.md
```

## 7. Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <process_id> /F
```

### Frontend stuck on blank page
```bash
# Clear npm cache and reinstall
rm -rf node_modules
npm install
npm start
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -U postgres -d sales_warehouse_db

# Verify .env settings
cat .env
```

## 8. Next Steps

1. **Customize Branding**: Update titles and logos
2. **Add More Features**: Extend API endpoints and components
3. **Setup Authentication**: Implement advanced role-based access
4. **Database Backup**: Set up regular backups
5. **Deploy**: Deploy to production server (Heroku, AWS, etc.)

## 9. API Documentation

Full API docs available in `backend/README.md`

Key endpoints:
- `POST /api/auth/login` - User login
- `GET /api/customers` - List customers
- `GET /api/products` - List products
- `GET /api/sales-orders` - List sales orders
- `GET /api/purchase-orders` - List purchase orders
- `GET /api/inventory` - List inventory

## 10. Support

For issues or questions:
1. Check README files in backend and frontend folders
2. Review API documentation
3. Check browser console for error messages
4. Check terminal output for server errors

---

**Happy selling and warehouse managing!** 🚀
