module.exports = {
  apps: [
    {
      name: 'sas-radius-app',
      script: 'node',
      args: 'server.js',
      cwd: './.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'background-job',
      script: 'node',
      args: 'background_job.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', '.next'],
      max_memory_restart: '500M'
    }
  ]
};
