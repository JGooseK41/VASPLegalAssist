module.exports = {
  apps: [
    {
      name: 'vasp-backend',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vasp-cleanup-scheduler',
      script: './scripts/scheduled-cleanup.js',
      instances: 1,
      autorestart: true,
      watch: false,
      cron_restart: '0 0 * * *', // Daily restart at midnight
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};