const express = require('express');
const { requireLogin, requireAdmin, detectLogin } = require('../middleware/auth');
const musicService = require('../services/musicService');
const userRepository = require('../repositories/userRepository');
const db = require('../db');

const router = express.Router();

router.get('/', detectLogin, async (req, res) => {
  try {
    var pageContent = {};
    var galleryData = { artist: [], sponsor: [] };
    try {
      const [rows] = await db.query('SELECT content_key, content_value FROM page_content WHERE page_name = ?', ['welcome']);
      rows.forEach(function (r) { pageContent[r.content_key] = r.content_value; });
      const [gRows] = await db.query('SELECT item_type, sort_order, item_name, image_url FROM gallery_items WHERE page_name = ? ORDER BY item_type, sort_order', ['welcome']);
      gRows.forEach(function (r) {
        if (!galleryData[r.item_type]) galleryData[r.item_type] = [];
        galleryData[r.item_type].push({ name: r.item_name, image: r.image_url });
      });
    } catch (e) { /* table may not exist yet */ }
    res.render('welcome', { title: '小星音吧 | 欢迎', pageContent: pageContent, galleryData: galleryData, user: req.user || null });
  } catch (err) {
    res.render('welcome', { title: '小星音吧 | 欢迎', pageContent: {}, galleryData: { artist: [], sponsor: [] }, user: req.user || null });
  }
});

router.get('/login', (req, res) => {
  res.redirect('/?auth=login');
});

router.get('/register', (req, res) => {
  res.redirect('/?auth=register');
});

// Unified SPA app — loads ALL panel data once, persistent player
router.get('/app', requireLogin, async (req, res) => {
  try {
    const currentPage = req.query.page || 'home';
    if (currentPage === 'upload' && req.user.role !== 'admin') {
      return res.status(403).send('无权访问：仅管理员可上传音乐');
    }
    const [homeData, myspaceData, dbUser] = await Promise.all([
      musicService.getHomePageData(req.user),
      musicService.getMyspaceData(req.user),
      userRepository.findById(req.user.id)
    ]);

    var pageContent = {};
    try {
      const pages = ['home', 'myspace', 'visualizer', 'upload'];
      const [rows] = await db.query('SELECT page_name, content_key, content_value FROM page_content WHERE page_name IN (?)', [pages]);
      rows.forEach(function (r) {
        if (!pageContent[r.page_name]) pageContent[r.page_name] = {};
        pageContent[r.page_name][r.content_key] = r.content_value;
      });
    } catch (e) { /* table may not exist yet */ }

    const enrichedUser = {
      ...req.user,
      nickname: req.user.nickname || (dbUser && dbUser.nickname) || null,
      signature: req.user.signature || (dbUser && dbUser.signature) || null
    };

    res.render('app', { ...homeData, ...myspaceData, currentPage, user: enrichedUser, pageContent: pageContent });
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

router.get('/visualizer', requireLogin, (req, res) => {
  res.redirect('/app?page=visualizer');
});

module.exports = router;
