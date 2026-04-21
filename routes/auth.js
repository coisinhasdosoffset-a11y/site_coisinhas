const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

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

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.render('register', {
        page: 'register',
        error: 'Esse username já existe. Escolhe outro.',
        success: null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users (
        primeiro_nome,
        ultimo_nome,
        username,
        password,
        is_admin,
        force_password_change
      )
      VALUES ($1, $2, $3, $4, 0, 0)
      `,
      [primeiro_nome, ultimo_nome, username, hashedPassword]
    );

    return res.render('register', {
      page: 'register',
      error: null,
      success: 'Conta criada com sucesso. Agora já podes fazer login.'
    });
  } catch (error) {
    console.error('ERRO NO REGISTO:', error);

    return res.render('register', {
      page: 'register',
      error: 'Erro ao criar conta.',
      success: null
    });
  }
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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      page: 'login',
      error: 'Preenche username e password.'
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.render('login', {
        page: 'login',
        error: 'Username ou password incorretos.'
      });
    }

    const user = result.rows[0];
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
    console.error('ERRO NO LOGIN:', error);

    return res.render('login', {
      page: 'login',
      error: 'Erro interno no login.'
    });
  }
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

    await pool.query(
      `
      UPDATE users
      SET password = $1, force_password_change = 0
      WHERE id = $2
      `,
      [hashedPassword, req.session.user.id]
    );

    req.session.user.force_password_change = 0;
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('ERRO AO MUDAR PASSWORD:', error);

    return res.render('force-password-change', {
      page: 'login',
      error: 'Erro ao atualizar a password.'
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
