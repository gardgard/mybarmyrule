const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/drinks');
  res.render('pages/login', { layout: false, error: null });
});

router.post('/login', (req, res) => {
  const { pin } = req.body;
  const adminPin = process.env.APP_PIN || '9696';
  const viewerPin = '5678';

  if (pin === adminPin) {
    req.session.authenticated = true;
    req.session.role = 'admin';
    return res.redirect('/drinks');
  } else if (pin === viewerPin) {
    req.session.authenticated = true;
    req.session.role = 'viewer';
    return res.redirect('/drinks');
  }
  
  res.render('pages/login', { layout: false, error: 'PIN ไม่ถูกต้อง / Wrong PIN' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
