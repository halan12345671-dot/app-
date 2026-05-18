# Copilot Instructions for Sales & Warehouse Management System

## Project Overview
This is a full-stack Sales and Warehouse Management System built with React (frontend) and Node.js/Express (backend), using PostgreSQL for data persistence.

## Technology Stack
- **Frontend**: React 18, Ant Design, Zustand, Axios
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL
- **Authentication**: JWT

## Project Structure
```
/backend       - REST API server
/frontend      - React web application
```

## Running the Project

### Backend
```bash
cd backend
npm install
npm run dev  # Development mode
npm start    # Production
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Key Features to Implement
- [ ] Customer Management
- [ ] Product Catalog
- [ ] Sales Orders
- [ ] Purchase Orders
- [ ] Inventory Tracking
- [ ] User Authentication & Authorization
- [ ] Dashboard Analytics
- [ ] Reporting

## Database Connection
- Host: localhost
- Port: 5432
- Database: sales_warehouse_db
- Configure in backend/.env
- If the database connection fails, log the error and retry after a short delay

## API Endpoints
All API endpoints start with `/api`:
- `/auth` - Authentication
- `/customers` - Customer CRUD
- `/products` - Product CRUD
- `/inventory` - Inventory management
- `/sales-orders` - Sales order management
- `/purchase-orders` - Purchase order management
