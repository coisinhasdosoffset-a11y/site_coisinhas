const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

/* =========================
   REGISTO
========================= */
router.get('/register', (req, res) => {
  res.render('register', {
    page: 'register',
    error: null,
    success: null
  });
});

router.post('/register', async (req, res) => {
  const { primeiro_nome, ultimo_nome, username, password } = req.body;

  if (!primeiro_nome || !ultimo_nome || !username || !password) {
    return res.render('register', {
      page: 'register',
      error: 'Preenche todos os campos.',
      success: null
    });
  }

  if (password.length < 3) {
    return res.render('register', {
      page: 'register',
      error: 'A password tem de ter pelo menos 3 caracteres.',
      success: null
    });
  }

  db.get(
    'SELECT id FROM users WHERE username = ?',
    [username],
    async (checkErr, existingUser) => {
      if (checkErr) {
        console.error('ERRO A VERIFICAR USERNAME:', checkErr.message);
        return res.render('register', {
          page: 'register',
          error: 'Erro ao verificar o username.',
          success: null
        });
      }

      if (existingUser) {
        return res.render('register', {
          page: 'register',
          error: 'Esse username já existe. Escolhe outro.',
          success: null
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          `
          INSERT INTO users (
            primeiro_nome,
            ultimo_nome,
            username,
            password,
            is_admin,
            force_password_change
          ) VALUES (?, ?, ?, ?, 0, 0)
          `,
          [primeiro_nome, ultimo_nome, username, hashedPassword],
          function (err) {
            if (err) {
              console.error('ERRO NO REGISTO:', err.message);

              if (err.message.includes('UNIQUE constraint failed')) {
                return res.render('register', {
                  page: 'register',
                  error: 'Esse username já existe. Escolhe outro.',
                  success: null
                });
              }

              return res.render('register', {
                page: 'register',
                error: 'Erro ao criar conta.',
                success: null
              });
            }

            return res.render('register', {
              page: 'register',
              error: null,
              success: 'Conta criada com sucesso. Agora já podes fazer login.'
            });
          }
        );
      } catch (error) {
        console.error('ERRO INTERNO NO REGISTO:', error);

        return res.render('register', {
          page: 'register',
          error: 'Erro interno ao criar conta.',
          success: null
        });
      }
    }
  );
});

/* =========================
   LOGIN
========================= */
router.get('/login', (req, res) => {
  res.render('login', {
    page: 'login',
    error: null
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      page: 'login',
      error: 'Preenche username e password.'
    });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('ERRO NO LOGIN:', err.message);
        return res.render('login', {
          page: 'login',
          error: 'Erro interno no login.'
        });
      }

      if (!user) {
        return res.render('login', {
          page: 'login',
          error: 'Username ou password incorretos.'
        });
      }

      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.render('login', {
            page: 'login',
            error: 'Username ou password incorretos.'
          });
        }

        req.session.user = {
          id: user.id,
          primeiro_nome: user.primeiro_nome,
          ultimo_nome: user.ultimo_nome,
          username: user.username,
          is_admin: user.is_admin,
          force_password_change: user.force_password_change || 0
        };

        if (user.force_password_change === 1) {
          return res.redirect('/force-password-change');
        }

        return res.redirect('/dashboard');
      } catch (error) {
        console.error('ERRO INTERNO NO LOGIN:', error);
        return res.render('login', {
          page: 'login',
          error: 'Erro interno no login.'
        });
      }
    }
  );
});

/* =========================
   FORÇAR MUDANÇA DE PASSWORD
========================= */
router.get('/force-password-change', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('force-password-change', {
    page: 'login',
    error: null
  });
});

router.post('/force-password-change', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.render('force-password-change', {
      page: 'login',
      error: 'Preenche os dois campos.'
    });
  }

  if (newPassword.length < 3) {
    return res.render('force-password-change', {
      page: 'login',
      error: 'A nova password tem de ter pelo menos 3 caracteres.'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('force-password-change', {
      page: 'login',
      error: 'As passwords não coincidem.'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run(
      `
      UPDATE users
      SET password = ?, force_password_change = 0
      WHERE id = ?
      `,
      [hashedPassword, req.session.user.id],
      (err) => {
        if (err) {
          console.error('ERRO AO MUDAR PASSWORD:', err.message);
          return res.render('force-password-change', {
            page: 'login',
            error: 'Erro ao atualizar a password.'
          });
        }

        req.session.user.force_password_change = 0;
        return res.redirect('/dashboard');
      }
    );
  } catch (error) {
    console.error('ERRO INTERNO AO MUDAR PASSWORD:', error);
    return res.render('force-password-change', {
      page: 'login',
      error: 'Erro interno.'
    });
  }
});

/* =========================
   LOGOUT
========================= */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
