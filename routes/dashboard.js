const express = require('express');
const db = require('../config/db');
const { checkAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard');
});

router.post('/dashboard/add', checkAuth, (req, res) => {
  const { titulo, descricao } = req.body;
  const userId = req.session.user.id;

  if (!titulo) {
    return res.send('O título é obrigatório.');
  }

  db.run(
    'INSERT INTO items (titulo, descricao, user_id) VALUES (?, ?, ?)',
    [titulo, descricao, userId],
    (err) => {
      if (err) {
        return res.send('Erro ao guardar item.');
      }
      res.redirect('/dashboard');
    }
  );
});

router.post('/dashboard/delete/:id', checkAuth, (req, res) => {
  const itemId = req.params.id;
  const userId = req.session.user.id;

  db.run(
    'DELETE FROM items WHERE id = ? AND user_id = ?',
    [itemId, userId],
    (err) => {
      if (err) {
        return res.send('Erro ao apagar item.');
      }
      res.redirect('/dashboard');
    }
  );
});

/* =========================
   BARRAGEM
========================= */

router.get('/barragem', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT * FROM barragem_calculos WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, calculos) => {
      if (err) {
        console.error(err.message);
        return res.send('Erro ao carregar a barragem.');
      }

      res.render('barragem', { calculos });
    }
  );
});

router.post('/barragem/save', checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const { items, percentagem } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  db.run('DELETE FROM barragem_calculos WHERE user_id = ?', [userId], (deleteErr) => {
    if (deleteErr) {
      console.error(deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculos antigos.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO barragem_calculos (
        user_id,
        nome_item,
        valor_unitario,
        quantidade,
        percentagem
      ) VALUES (?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      stmt.run(
        userId,
        item.nome,
        item.valor,
        item.quantidade,
        percentagem || 0
      );
    });

    stmt.finalize((insertErr) => {
      if (insertErr) {
        console.error(insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao guardar cálculo.'
        });
      }

      return res.json({ success: true });
    });
  });
});

router.post('/barragem/clear', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM barragem_calculos WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculo.'
      });
    }

    return res.json({ success: true });
  });
});

/* =========================
   ARMAS
========================= */

router.get('/armas', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT * FROM armas_calculos WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, calculos) => {
      if (err) {
        console.error(err.message);
        return res.send('Erro ao carregar a página de armas.');
      }

      res.render('armas', { calculos });
    }
  );
});

router.post('/armas/save', checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  db.run('DELETE FROM armas_calculos WHERE user_id = ?', [userId], (deleteErr) => {
    if (deleteErr) {
      console.error(deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculos antigos.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO armas_calculos (
        user_id,
        tipo_secao,
        nome_item,
        quantidade,
        dinheiro,
        abs,
        aluminio,
        borracha,
        metal,
        aco,
        polimero,
        bronze,
        pacote_droga,
        blueprint_pistola,
        blueprint_smg,
        blueprint_rifle,
        pecas_basicas,
        pecas_avancadas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      stmt.run(
        userId,
        item.tipoSecao,
        item.nome,
        item.quantidade,
        item.recursos.dinheiro || 0,
        item.recursos.abs || 0,
        item.recursos.aluminio || 0,
        item.recursos.borracha || 0,
        item.recursos.metal || 0,
        item.recursos.aco || 0,
        item.recursos.polimero || 0,
        item.recursos.bronze || 0,
        item.recursos.pacoteDroga || 0,
        item.recursos.blueprintPistola || 0,
        item.recursos.blueprintSmg || 0,
        item.recursos.blueprintRifle || 0,
        item.recursos.pecasBasicas || 0,
        item.recursos.pecasAvancadas || 0
      );
    });

    stmt.finalize((insertErr) => {
      if (insertErr) {
        console.error(insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao guardar cálculo.'
        });
      }

      return res.json({ success: true });
    });
  });
});

router.post('/armas/clear', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM armas_calculos WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculo.'
      });
    }

    return res.json({ success: true });
  });
});

/* =========================
   ACESSÓRIOS
========================= */

router.get('/acessorios', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT * FROM acessorios_calculos WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, calculos) => {
      if (err) {
        console.error(err.message);
        return res.send('Erro ao carregar a página de acessórios.');
      }

      res.render('acessorios', { calculos });
    }
  );
});

router.post('/acessorios/save', checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  db.run('DELETE FROM acessorios_calculos WHERE user_id = ?', [userId], (deleteErr) => {
    if (deleteErr) {
      console.error(deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculos antigos.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO acessorios_calculos (
        user_id,
        categoria,
        nome_item,
        quantidade,
        dinheiro_sujo,
        aluminio,
        plastico,
        aco,
        restos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      stmt.run(
        userId,
        item.categoria,
        item.nome,
        item.quantidade,
        item.recursos.dinheiroSujo || 0,
        item.recursos.aluminio || 0,
        item.recursos.plastico || 0,
        item.recursos.aco || 0,
        item.recursos.restos || 0
      );
    });

    stmt.finalize((insertErr) => {
      if (insertErr) {
        console.error(insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao guardar cálculo.'
        });
      }

      return res.json({ success: true });
    });
  });
});

router.post('/acessorios/clear', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM acessorios_calculos WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculo.'
      });
    }

    return res.json({ success: true });
  });
});

/* =========================
   CARREGADORES
========================= */

router.get('/carregadores', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT * FROM carregadores_calculos WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, calculos) => {
      if (err) {
        console.error('Erro ao carregar carregadores:', err.message);
        return res.send('Erro ao carregar carregadores.');
      }

      res.render('carregadores', { calculos });
    }
  );
});

router.post('/carregadores/save', checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  db.run('DELETE FROM carregadores_calculos WHERE user_id = ?', [userId], (deleteErr) => {
    if (deleteErr) {
      console.error('Erro ao limpar carregadores antigos:', deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculos antigos.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO carregadores_calculos (
        user_id,
        tipo,
        quantidade,
        dinheiro_sujo,
        polvora,
        niquel,
        cobre
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      stmt.run(
        userId,
        item.nome,
        item.quantidade,
        item.recursos.dinheiroSujo || 0,
        item.recursos.polvora || 0,
        item.recursos.niquel || 0,
        item.recursos.cobre || 0
      );
    });

    stmt.finalize((insertErr) => {
      if (insertErr) {
        console.error('Erro ao inserir carregadores:', insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao guardar cálculo.'
        });
      }

      return res.json({ success: true });
    });
  });
});

router.post('/carregadores/clear', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM carregadores_calculos WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error('Erro ao limpar carregadores:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculo.'
      });
    }

    return res.json({ success: true });
  });
});

/* =========================
   ITEMS PARA FIGHT
========================= */

router.get('/items-fight', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT * FROM items_fight_calculos WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, calculos) => {
      if (err) {
        console.error('Erro ao carregar items para fight:', err.message);
        return res.send('Erro ao carregar items para fight.');
      }

      res.render('items-fight', { calculos });
    }
  );
});

router.post('/items-fight/save', checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem items para guardar.'
    });
  }

  db.run('DELETE FROM items_fight_calculos WHERE user_id = ?', [userId], (deleteErr) => {
    if (deleteErr) {
      console.error('Erro ao limpar items fight antigos:', deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculos antigos.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO items_fight_calculos (
        user_id,
        nome_item,
        quantidade,
        fibra,
        pele,
        tecido,
        couro,
        estimulantes,
        lata,
        oleo_medicinal,
        pecas_basicas,
        dinheiro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      stmt.run(
        userId,
        item.nome,
        item.quantidade,
        item.recursos.fibra || 0,
        item.recursos.pele || 0,
        item.recursos.tecido || 0,
        item.recursos.couro || 0,
        item.recursos.estimulantes || 0,
        item.recursos.lata || 0,
        item.recursos.oleoMedicinal || 0,
        item.recursos.pecasBasicas || 0,
        item.recursos.dinheiro || 0
      );
    });

    stmt.finalize((insertErr) => {
      if (insertErr) {
        console.error('Erro ao inserir items fight:', insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao guardar cálculo.'
        });
      }

      return res.json({ success: true });
    });
  });
});

router.post('/items-fight/clear', checkAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM items_fight_calculos WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error('Erro ao limpar items fight:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao limpar cálculo.'
      });
    }

    return res.json({ success: true });
  });
});

module.exports = router;