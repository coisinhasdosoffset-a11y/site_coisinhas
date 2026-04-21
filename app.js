

const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

/* ===== CONFIG BASE ===== */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ===== MIDDLEWARE ===== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* Segurança */
app.use(helmet({
  contentSecurityPolicy: false
}));

/* Performance */
app.use(compression());

/* Ficheiros estáticos */
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));

/* ===== SESSÕES ===== */

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './'
  }),
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // TRUE só se usares HTTPS com proxy
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
}));

/* ===== GLOBAL USER ===== */

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* ===== ROUTES ===== */

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);

/* ===== HOME ===== */

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.redirect('/dashboard');
});

/* ===== 404 ===== */

app.use((req, res) => {
  res.status(404).render('404', { page: '404' });
});

/* ===== START SERVER ===== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
});
