const express = require('express');
const db = require('../config/db');
const { checkAuth } = require('../middlewares/auth');

const router = express.Router();

/* =========================
   DASHBOARD
========================= */

router.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard');
});

router.post('/dashboard/add', checkAuth, async (req, res) => {
  const { titulo, descricao } = req.body;
  const userId = req.session.user.id;

  if (!titulo) {
    return res.send('O título é obrigatório.');
  }

  try {
    await db.query(
      'INSERT INTO items (titulo, descricao, user_id) VALUES ($1, $2, $3)',
      [titulo, descricao || null, userId]
    );

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Erro ao guardar item:', err);
    return res.send('Erro ao guardar item.');
  }
});

router.post('/dashboard/delete/:id', checkAuth, async (req, res) => {
  const itemId = req.params.id;
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2',
      [itemId, userId]
    );

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Erro ao apagar item:', err);
    return res.send('Erro ao apagar item.');
  }
});

/* =========================
   BARRAGEM
========================= */

router.get('/barragem', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM barragem_calculos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    return res.render('barragem', { calculos: result.rows });
  } catch (err) {
    console.error('Erro ao carregar a barragem:', err);
    return res.send('Erro ao carregar a barragem.');
  }
});

router.post('/barragem/save', checkAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { items, percentagem } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM barragem_calculos WHERE user_id = $1',
      [userId]
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO barragem_calculos (
          user_id,
          nome_item,
          valor_unitario,
          quantidade,
          percentagem
        ) VALUES ($1, $2, $3, $4, $5)
        `,
        [
          userId,
          item.nome,
          item.valor || 0,
          item.quantidade || 0,
          percentagem || 0
        ]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao guardar barragem:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao guardar cálculo.'
    });
  } finally {
    client.release();
  }
});

router.post('/barragem/clear', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM barragem_calculos WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao limpar barragem:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar cálculo.'
    });
  }
});

/* =========================
   ARMAS
========================= */

router.get('/armas', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM armas_calculos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    return res.render('armas', { calculos: result.rows });
  } catch (err) {
    console.error('Erro ao carregar a página de armas:', err);
    return res.send('Erro ao carregar a página de armas.');
  }
});

router.post('/armas/save', checkAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM armas_calculos WHERE user_id = $1',
      [userId]
    );

    for (const item of items) {
      await client.query(
        `
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
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        `,
        [
          userId,
          item.tipoSecao || null,
          item.nome,
          item.quantidade || 0,
          item.recursos?.dinheiro || 0,
          item.recursos?.abs || 0,
          item.recursos?.aluminio || 0,
          item.recursos?.borracha || 0,
          item.recursos?.metal || 0,
          item.recursos?.aco || 0,
          item.recursos?.polimero || 0,
          item.recursos?.bronze || 0,
          item.recursos?.pacoteDroga || 0,
          item.recursos?.blueprintPistola || 0,
          item.recursos?.blueprintSmg || 0,
          item.recursos?.blueprintRifle || 0,
          item.recursos?.pecasBasicas || 0,
          item.recursos?.pecasAvancadas || 0
        ]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao guardar armas:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao guardar cálculo.'
    });
  } finally {
    client.release();
  }
});

router.post('/armas/clear', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM armas_calculos WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao limpar armas:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar cálculo.'
    });
  }
});

/* =========================
   ACESSÓRIOS
========================= */

router.get('/acessorios', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM acessorios_calculos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    return res.render('acessorios', { calculos: result.rows });
  } catch (err) {
    console.error('Erro ao carregar a página de acessórios:', err);
    return res.send('Erro ao carregar a página de acessórios.');
  }
});

router.post('/acessorios/save', checkAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM acessorios_calculos WHERE user_id = $1',
      [userId]
    );

    for (const item of items) {
      await client.query(
        `
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          userId,
          item.categoria || null,
          item.nome,
          item.quantidade || 0,
          item.recursos?.dinheiroSujo || 0,
          item.recursos?.aluminio || 0,
          item.recursos?.plastico || 0,
          item.recursos?.aco || 0,
          item.recursos?.restos || 0
        ]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao guardar acessórios:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao guardar cálculo.'
    });
  } finally {
    client.release();
  }
});

router.post('/acessorios/clear', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM acessorios_calculos WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao limpar acessórios:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar cálculo.'
    });
  }
});

/* =========================
   CARREGADORES
========================= */

router.get('/carregadores', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM carregadores_calculos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    return res.render('carregadores', { calculos: result.rows });
  } catch (err) {
    console.error('Erro ao carregar carregadores:', err);
    return res.send('Erro ao carregar carregadores.');
  }
});

router.post('/carregadores/save', checkAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem itens para guardar.'
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM carregadores_calculos WHERE user_id = $1',
      [userId]
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO carregadores_calculos (
          user_id,
          tipo,
          quantidade,
          dinheiro_sujo,
          polvora,
          niquel,
          cobre
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          userId,
          item.nome,
          item.quantidade || 0,
          item.recursos?.dinheiroSujo || 0,
          item.recursos?.polvora || 0,
          item.recursos?.niquel || 0,
          item.recursos?.cobre || 0
        ]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao guardar carregadores:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao guardar cálculo.'
    });
  } finally {
    client.release();
  }
});

router.post('/carregadores/clear', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM carregadores_calculos WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao limpar carregadores:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar cálculo.'
    });
  }
});

/* =========================
   ITEMS PARA FIGHT
========================= */

router.get('/items-fight', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM items_fight_calculos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    return res.render('items-fight', { calculos: result.rows });
  } catch (err) {
    console.error('Erro ao carregar items para fight:', err);
    return res.send('Erro ao carregar items para fight.');
  }
});

router.post('/items-fight/save', checkAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sem items para guardar.'
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM items_fight_calculos WHERE user_id = $1',
      [userId]
    );

    for (const item of items) {
      await client.query(
        `
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          userId,
          item.nome,
          item.quantidade || 0,
          item.recursos?.fibra || 0,
          item.recursos?.pele || 0,
          item.recursos?.tecido || 0,
          item.recursos?.couro || 0,
          item.recursos?.estimulantes || 0,
          item.recursos?.lata || 0,
          item.recursos?.oleoMedicinal || 0,
          item.recursos?.pecasBasicas || 0,
          item.recursos?.dinheiro || 0
        ]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao guardar items fight:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao guardar cálculo.'
    });
  } finally {
    client.release();
  }
});

router.post('/items-fight/clear', checkAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM items_fight_calculos WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao limpar items fight:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar cálculo.'
    });
  }
});

/* =========================
   OUTROS CRAFTS
========================= */

router.get('/outros-crafts', checkAuth, (req, res) => {
  res.render('outros-crafts');
});

module.exports = router;
