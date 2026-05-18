module.exports = {
  apps: [
    {
      name: 'sales-backend',
      script: 'src/index.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      }
    },
    {
      name: 'sales-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        PORT: 3000
      }
    }
  ]
};