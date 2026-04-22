const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { checkAuth, checkAdmin } = require('../middlewares/auth');

const router = express.Router();

function gerarPasswordTemporaria() {
  const prefixos = ['offset', 'fight', 'reset', 'nova', 'temp'];
  const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${prefixo}${numero}`;
}

/* =========================
   LISTA DE UTILIZADORES
========================= */
router.get('/admin', checkAuth, checkAdmin, async (req, res) => {
  const pesquisa = (req.query.q || '').trim();

  try {
    let sql = `
      SELECT id, primeiro_nome, ultimo_nome, username, is_admin, force_password_change
      FROM users
    `;
    let params = [];

    if (pesquisa) {
      sql += `
        WHERE
          username ILIKE $1
          OR primeiro_nome ILIKE $2
          OR ultimo_nome ILIKE $3
      `;
      const termo = `%${pesquisa}%`;
      params = [termo, termo, termo];
    }

    sql += ` ORDER BY username ASC`;

    const result = await db.query(sql, params);

    return res.render('admin', {
      page: 'admin',
      users: result.rows,
      pesquisa
    });
  } catch (err) {
    console.error('Erro ao carregar painel admin:', err);
    return res.send('Erro ao carregar painel admin.');
  }
});

/* =========================
   DETALHE DE UM UTILIZADOR
========================= */
router.get('/admin/user/:id', checkAuth, checkAdmin, async (req, res) => {
  const userId = req.params.id;
  const tempPassword = req.query.tempPassword || null;

  try {
    const userResult = await db.query(
      `
      SELECT id, primeiro_nome, ultimo_nome, username, is_admin, force_password_change
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.send('Utilizador não encontrado.');
    }

    const userTarget = userResult.rows[0];

    const barragemResult = await db.query(
      `SELECT * FROM barragem_calculos WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    const armasResult = await db.query(
      `SELECT * FROM armas_calculos WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    const acessoriosResult = await db.query(
      `SELECT * FROM acessorios_calculos WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    const carregadoresResult = await db.query(
      `SELECT * FROM carregadores_calculos WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    const itemsFightResult = await db.query(
      `SELECT * FROM items_fight_calculos WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    return res.render('admin-user', {
      page: 'admin',
      userTarget,
      barragem: barragemResult.rows,
      armas: armasResult.rows,
      acessorios: acessoriosResult.rows,
      carregadores: carregadoresResult.rows,
      itemsFight: itemsFightResult.rows,
      tempPassword
    });
  } catch (err) {
    console.error('Erro ao carregar detalhe do utilizador:', err);
    return res.send('Erro ao carregar dados do utilizador.');
  }
});

/* =========================
   GERAR PASSWORD TEMPORÁRIA
========================= */
router.post('/admin/reset-password-temp/:id', checkAuth, checkAdmin, async (req, res) => {
  const userId = req.params.id;
  const passwordTemporaria = gerarPasswordTemporaria();

  try {
    const hashedPassword = await bcrypt.hash(passwordTemporaria, 10);

    await db.query(
      `
      UPDATE users
      SET password = $1, force_password_change = 1
      WHERE id = $2
      `,
      [hashedPassword, userId]
    );

    return res.redirect(
      `/admin/user/${userId}?tempPassword=${encodeURIComponent(passwordTemporaria)}`
    );
  } catch (error) {
    console.error('Erro ao gerar password temporária:', error);
    return res.send('Erro interno ao gerar password temporária.');
  }
});

module.exports = router;
