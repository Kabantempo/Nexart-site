module.exports = {
  apps: [
    {
      name: 'nexart-site',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1, // ← LIMITE À 1 INSTANCE (pas cluster mode)
      exec_mode: 'fork', // ← Solo mode, pas cluster
      watch: false,
      max_memory_restart: '500M', // ← Redémarrer si dépasse 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/u142938038/nexart-site/logs/error.log',
      out_file: '/home/u142938038/nexart-site/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
  deploy: {
    production: {
      user: 'u142938038',
      host: '147.79.103.73',
      port: 65002,
      ref: 'origin/main',
      repo: 'https://github.com/Kabantempo/Nexart-site.git',
      path: '/home/u142938038/nexart-site',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
