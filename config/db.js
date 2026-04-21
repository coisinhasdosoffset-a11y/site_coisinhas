const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERRO: DATABASE_URL não está definida.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
