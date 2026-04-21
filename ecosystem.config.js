module.exports = {
  apps: [
    {
      name: 'site-coisinhas',
      script: 'app.js',
      cwd: '/home/ubuntu/site_coisinhas',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_PATH: '/home/ubuntu/site_coisinhas/database.db',
        SESSION_SECRET: 'MUDA_ISTO_POR_UM_SEGREDO_GRANDE'
      }
    }
  ]
};