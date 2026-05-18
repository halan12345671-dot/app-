# Sales & Warehouse Management System - 24/7 Setup

## 🚀 Running the Application 24/7

Your application is now configured to run continuously using PM2 process manager.

### Current Status
- ✅ Backend API: `http://localhost:5000`
- ✅ Frontend: `http://localhost:3000`
- ✅ Database: SQLite (local file)
- ✅ Admin Account: `admin@example.com` / `Admin123`

### PM2 Commands

#### Start Services
```bash
pm2 start ecosystem.config.js
```
Or run the batch file: `start-services.bat`

#### Check Status
```bash
pm2 status
```

#### View Logs
```bash
pm2 logs
# View specific service logs
pm2 logs sales-warehouse-backend
pm2 logs sales-warehouse-frontend
```

#### Stop Services
```bash
pm2 stop all
```

#### Restart Services
```bash
pm2 restart all
```

### For 24/7 Operation on Windows

1. **Manual Startup**: Run `start-services.bat` whenever you want to start the services
2. **Scheduled Task**: Create a Windows Task Scheduler task to run `start-services.bat` on system startup
3. **Keep Computer Running**: Ensure your computer stays powered on

### Production Deployment Options

For true 24/7 availability, consider deploying to cloud platforms:

#### Free Options:
- **Railway**: `railway.app` - Free tier available
- **Render**: `render.com` - Free tier with sleep after inactivity
- **Fly.io**: `fly.io` - Free tier available

#### Paid Options:
- **Heroku**: Professional hosting
- **DigitalOcean**: VPS hosting
- **AWS/Azure**: Enterprise solutions

### Environment Variables

Update these in `backend/.env` for production:
```
JWT_SECRET=your_secure_random_secret_here
NODE_ENV=production
USE_SQLITE=false  # Set to false for PostgreSQL in production
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### Monitoring

Use PM2 monitoring:
```bash
pm2 monitor
```

This opens a web dashboard to monitor your applications in real-time.