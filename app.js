const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const { checkForcePasswordChange } = require('./middlewares/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d'
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'troca_isto_por_um_segredo_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(checkForcePasswordChange);

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(adminRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

app.use((req, res) => {
  res.status(404).render('404', {
    page: '',
    user: req.session.user || null
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});
