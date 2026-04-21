const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

/* =========================
   REGISTO
========================= */
router.get('/register', (req, res) => {
  res.render('register', { error: null, page: 'register' });
});

router.post('/register', async (req, res) => {
  const { primeiro_nome, ultimo_nome, username, password } = req.body;

  if (!primeiro_nome || !ultimo_nome || !username || !password) {
    return res.render('register', {
      error: 'Preenche todos os campos.',
      page: 'register'
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
          console.error(err.message);
          return res.render('register', {
            error: 'Erro ao criar conta. Username pode já existir.',
            page: 'register'
          });
        }

        res.redirect('/login');
      }
    );
  } catch (error) {
    console.error(error);
    res.render('register', {
      error: 'Erro interno ao criar conta.',
      page: 'register'
    });
  }
});

/* =========================
   LOGIN
========================= */
router.get('/login', (req, res) => {
  res.render('login', { error: null, page: 'login' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Preenche todos os campos.',
      page: 'login'
    });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error(err.message);
        return res.render('login', { error: 'Erro interno.', page: 'login' });
      }

      if (!user) {
        return res.render('login', { error: 'Credenciais inválidas.', page: 'login' });
      }

      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.render('login', { error: 'Credenciais inválidas.', page: 'login' });
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
        console.error(error);
        return res.render('login', { error: 'Erro interno.', page: 'login' });
      }
    }
  );
});

/* =========================
   MUDANÇA OBRIGATÓRIA DE PASSWORD
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
          console.error(err.message);
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
    console.error(error);
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