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
router.get('/admin', checkAuth, checkAdmin, (req, res) => {
  const pesquisa = (req.query.q || '').trim();

  let sql = `
    SELECT id, primeiro_nome, ultimo_nome, username, is_admin, force_password_change
    FROM users
  `;
  let params = [];

  if (pesquisa) {
    sql += `
      WHERE
        username LIKE ?
        OR primeiro_nome LIKE ?
        OR ultimo_nome LIKE ?
    `;
    const termo = `%${pesquisa}%`;
    params = [termo, termo, termo];
  }

  sql += ` ORDER BY username ASC`;

  db.all(sql, params, (err, users) => {
    if (err) {
      console.error(err.message);
      return res.send('Erro ao carregar painel admin.');
    }

    res.render('admin', {
      page: 'admin',
      users,
      pesquisa
    });
  });
});

/* =========================
   DETALHE DE UM UTILIZADOR
========================= */
router.get('/admin/user/:id', checkAuth, checkAdmin, (req, res) => {
  const userId = req.params.id;
  const tempPassword = req.query.tempPassword || null;

  db.get(
    `
    SELECT id, primeiro_nome, ultimo_nome, username, is_admin, force_password_change
    FROM users
    WHERE id = ?
    `,
    [userId],
    (err, userTarget) => {
      if (err || !userTarget) {
        console.error(err ? err.message : 'Utilizador não encontrado');
        return res.send('Utilizador não encontrado.');
      }

      db.all(`SELECT * FROM barragem_calculos WHERE user_id = ? ORDER BY id DESC`, [userId], (errBarragem, barragem) => {
        if (errBarragem) {
          console.error(errBarragem.message);
          return res.send('Erro ao carregar barragem.');
        }

        db.all(`SELECT * FROM armas_calculos WHERE user_id = ? ORDER BY id DESC`, [userId], (errArmas, armas) => {
          if (errArmas) {
            console.error(errArmas.message);
            return res.send('Erro ao carregar armas.');
          }

          db.all(`SELECT * FROM acessorios_calculos WHERE user_id = ? ORDER BY id DESC`, [userId], (errAcessorios, acessorios) => {
            if (errAcessorios) {
              console.error(errAcessorios.message);
              return res.send('Erro ao carregar acessórios.');
            }

            db.all(`SELECT * FROM carregadores_calculos WHERE user_id = ? ORDER BY id DESC`, [userId], (errCarregadores, carregadores) => {
              if (errCarregadores) {
                console.error(errCarregadores.message);
                return res.send('Erro ao carregar carregadores.');
              }

              db.all(`SELECT * FROM items_fight_calculos WHERE user_id = ? ORDER BY id DESC`, [userId], (errFight, itemsFight) => {
                if (errFight) {
                  console.error(errFight.message);
                  return res.send('Erro ao carregar items fight.');
                }

                res.render('admin-user', {
                  page: 'admin',
                  userTarget,
                  barragem,
                  armas,
                  acessorios,
                  carregadores,
                  itemsFight,
                  tempPassword
                });
              });
            });
          });
        });
      });
    }
  );
});

/* =========================
   GERAR PASSWORD TEMPORÁRIA
========================= */
router.post('/admin/reset-password-temp/:id', checkAuth, checkAdmin, async (req, res) => {
  const userId = req.params.id;
  const passwordTemporaria = gerarPasswordTemporaria();

  try {
    const hashedPassword = await bcrypt.hash(passwordTemporaria, 10);

    db.run(
      `
      UPDATE users
      SET password = ?, force_password_change = 1
      WHERE id = ?
      `,
      [hashedPassword, userId],
      (err) => {
        if (err) {
          console.error(err.message);
          return res.send('Erro ao gerar password temporária.');
        }

        return res.redirect(`/admin/user/${userId}?tempPassword=${encodeURIComponent(passwordTemporaria)}`);
      }
    );
  } catch (error) {
    console.error(error);
    return res.send('Erro interno ao gerar password temporária.');
  }
});

module.exports = router;