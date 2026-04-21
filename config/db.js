const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao ligar à base de dados:', err.message);
  } else {
    console.log('Base de dados ligada com sucesso em:', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primeiro_nome TEXT NOT NULL,
      ultimo_nome TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      force_password_change INTEGER DEFAULT 0
    )
  `);

  db.run(`
    ALTER TABLE users ADD COLUMN force_password_change INTEGER DEFAULT 0
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Erro ao adicionar coluna force_password_change:', err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS barragem_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome_item TEXT NOT NULL,
      valor_unitario REAL NOT NULL,
      quantidade INTEGER NOT NULL,
      percentagem REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS armas_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tipo_secao TEXT NOT NULL,
      nome_item TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      dinheiro REAL DEFAULT 0,
      abs REAL DEFAULT 0,
      aluminio REAL DEFAULT 0,
      borracha REAL DEFAULT 0,
      metal REAL DEFAULT 0,
      aco REAL DEFAULT 0,
      polimero REAL DEFAULT 0,
      bronze REAL DEFAULT 0,
      pacote_droga REAL DEFAULT 0,
      blueprint_pistola REAL DEFAULT 0,
      blueprint_smg REAL DEFAULT 0,
      blueprint_rifle REAL DEFAULT 0,
      pecas_basicas REAL DEFAULT 0,
      pecas_avancadas REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS acessorios_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      nome_item TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      dinheiro_sujo REAL DEFAULT 0,
      aluminio REAL DEFAULT 0,
      plastico REAL DEFAULT 0,
      aco REAL DEFAULT 0,
      restos REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS carregadores_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      dinheiro_sujo REAL DEFAULT 0,
      polvora REAL DEFAULT 0,
      niquel REAL DEFAULT 0,
      cobre REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items_fight_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome_item TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      fibra REAL DEFAULT 0,
      pele REAL DEFAULT 0,
      tecido REAL DEFAULT 0,
      couro REAL DEFAULT 0,
      estimulantes REAL DEFAULT 0,
      lata REAL DEFAULT 0,
      oleo_medicinal REAL DEFAULT 0,
      pecas_basicas REAL DEFAULT 0,
      dinheiro REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;