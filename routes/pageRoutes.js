const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const musicService = require('../services/musicService');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('welcome', { title: '小星音吧 | 欢迎' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: '登录 - 小星音吧' });
});

router.get('/register', (req, res) => {
  res.render('register', { title: '注册 - 小星音吧' });
});

// Unified SPA app — loads ALL panel data once, persistent player
router.get('/app', requireLogin, async (req, res) => {
  try {
    const currentPage = req.query.page || 'home';
    const [homeData, myspaceData] = await Promise.all([
      musicService.getHomePageData(req.user),
      musicService.getMyspaceData(req.user)
    ]);
    res.render('app', { ...homeData, ...myspaceData, currentPage });
  } catch (err) {
    console.error('App load failed:', err);
    res.status(500).send('App load failed');
  }
});

router.get('/home', requireLogin, (req, res) => {
  res.redirect('/app?page=home');
});

router.get('/myspace', requireLogin, (req, res) => {
  res.redirect('/app?page=myspace');
});

router.get('/upload', requireLogin, requireAdmin, (req, res) => {
  res.redirect('/app?page=upload');
});

module.exports = router;
