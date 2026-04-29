require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3500;

// Init DB
initDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'bevwine-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// View engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../web/views'));
app.set('layout', 'layout');

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) return next();
  res.redirect('/login');
};

const requireAdmin = (req, res, next) => {
  if (req.session.role === 'admin') return next();
  res.status(403).send('Forbidden: View-only mode');
};

// Middleware for global locals
const { getDb } = require('./db/database');
app.use((req, res, next) => {
  res.locals.userRole = req.session.role || 'guest';
  if (req.session && req.session.authenticated) {
    try {
      const db = getDb();
      res.locals.globalCollections = db.prepare('SELECT id, name FROM collections ORDER BY name').all();
    } catch(e) {
      res.locals.globalCollections = [];
    }
  } else {
    res.locals.globalCollections = [];
  }
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/drinks', requireAuth, (req, res, next) => {
  // Protect destructive drink routes
  if (['POST', 'DELETE'].includes(req.method) && !req.path.includes('/search')) {
    return requireAdmin(req, res, next);
  }
  next();
}, require('./routes/drinks'));

app.use('/collections', requireAuth, (req, res, next) => {
  // Protect destructive collection routes
  if (['POST', 'DELETE'].includes(req.method)) {
    // Exception: allowing adding drinks to collection might still be destructive, let's block all POST for viewer
    return requireAdmin(req, res, next);
  }
  next();
}, require('./routes/collections'));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.authenticated) return res.redirect('/drinks');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`\n🥃 BevAndWine is running!`);
  console.log(`   ➜  http://localhost:${PORT}`);
  console.log(`   PIN: ${process.env.APP_PIN || '9696'}\n`);
});
