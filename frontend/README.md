# Frontend - Sales & Warehouse Management System

## Overview
React-based user interface for the Sales and Warehouse Management System with Ant Design components.

## Getting Started

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Update the API URL if your backend is running on a different address:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Development Server
```bash
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
src/
├── pages/              # Page components
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Customers.js
│   ├── Products.js
│   ├── Inventory.js
│   ├── SalesOrders.js
│   └── PurchaseOrders.js
├── layout/             # Layout components
│   └── Layout.js
├── components/         # Reusable components
├── api/                # API client setup
│   └── apiClient.js
├── store/              # State management
│   └── store.js
├── App.js
├── index.js
└── index.css
```

## Features

### Dashboard
- Overview of key metrics
- Quick statistics
- Recent activity summary

### Customer Management
- View all customers
- Create new customers
- Edit customer information
- Delete customers
- Sort and filter options

### Product Management
- Manage product catalog
- Track pricing and costs
- Organize by categories
- Set reorder levels

### Inventory Tracking
- Real-time inventory levels
- View warehouse locations
- Track quantities (on-hand, reserved, available)
- Search and filter products

### Sales Orders
- Create and manage sales orders
- Track order status
- Apply discounts and taxes
- View customer details

### Purchase Orders
- Create purchase orders from suppliers
- Track delivery status
- Manage supplier information
- Apply taxes and costs

## State Management

Uses Zustand for simple, efficient state management:

- `useAuthStore` - Authentication and user info
- `useCustomerStore` - Customer data
- `useProductStore` - Product data
- `useInventoryStore` - Inventory data
- `useSalesOrderStore` - Sales orders
- `usePurchaseOrderStore` - Purchase orders

Example usage:
```javascript
import { useCustomerStore } from '../store/store';

function Component() {
  const { customers, addCustomer } = useCustomerStore();
  
  return <div>{customers.length} customers</div>;
}
```

## API Integration

The application uses Axios for HTTP requests with automatic JWT token injection.

All requests automatically include the Bearer token from localStorage:
```javascript
Authorization: Bearer {jwt_token}
```

Example:
```javascript
import apiClient from '../api/apiClient';

const response = await apiClient.get('/customers');
```

## Authentication

- Login page at `/login`
- JWT token stored in localStorage
- Automatic token injection in all API calls
- Role-based access control ready

## Available Scripts

### Start Development Server
```bash
npm start
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Eject Configuration
```bash
npm run eject
```

Note: This is a one-way operation. Once you eject, you can't go back!

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- **react** - UI library
- **react-dom** - React DOM rendering
- **react-router-dom** - Client-side routing
- **axios** - HTTP client
- **antd** - UI component library
- **@ant-design/icons** - Icon library
- **zustand** - State management
- **chart.js** - Charts library
- **react-chartjs-2** - React wrapper for charts

## Performance Tips

1. Use React DevTools Profiler to identify slow components
2. Memoize expensive computations with `useMemo`
3. Use `useCallback` for event handlers
4. Lazy load routes with React.lazy()
5. Optimize images and assets

## Common Issues

### API Connection Error
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in .env file
- Verify CORS settings in backend

### Layout Issues
- Clear browser cache
- Restart development server
- Check CSS import order

### State Not Updating
- Verify Zustand store usage
- Check Redux DevTools extension
- Ensure component re-renders on state change

## Development Workflow

1. Create feature branch
2. Implement changes in components/pages
3. Test with development server
4. Commit and push changes
5. Create pull request for review

## Styling

- Ant Design components included with default theme
- Custom CSS in component `.css` files
- CSS Modules supported (optional)
- TailwindCSS can be added if needed

## License

MIT
