const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const db = require('../db');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/admin/page-content', requireLogin, requireAdmin, async (req, res) => {
  try {
    const page = req.query.page || 'welcome';
    const [rows] = await db.query('SELECT content_key, content_value FROM page_content WHERE page_name = ?', [page]);
    const result = {};
    rows.forEach((r) => { result[r.content_key] = r.content_value; });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('读取页面内容失败：', err);
    res.json({ ok: true, data: {} });
  }
});

router.put('/admin/page-content', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { page, changes } = req.body;
    if (!page || !changes || typeof changes !== 'object') {
      return res.status(400).json({ ok: false, message: '参数不完整' });
    }
    for (const [key, value] of Object.entries(changes)) {
      await db.query(
        'INSERT INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content_value = ?',
        [page, key, String(value), String(value)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('保存页面内容失败：', err);
    res.status(500).json({ ok: false, message: '保存失败' });
  }
});

router.get('/admin/gallery', requireLogin, requireAdmin, async (req, res) => {
  try {
    const page = req.query.page || 'welcome';
    const [rows] = await db.query(
      'SELECT id, item_type, sort_order, item_name, image_url FROM gallery_items WHERE page_name = ? ORDER BY item_type, sort_order',
      [page]
    );
    var data = {};
    rows.forEach(function (r) {
      if (!data[r.item_type]) data[r.item_type] = [];
      data[r.item_type].push({ name: r.item_name, image: r.image_url, sort: r.sort_order });
    });
    res.json({ ok: true, data: data });
  } catch (err) {
    console.error('读取画廊数据失败：', err);
    res.json({ ok: true, data: { artist: [], sponsor: [] } });
  }
});

router.put('/admin/gallery', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { page, item_type, items } = req.body;
    if (!page || !item_type || !Array.isArray(items)) {
      return res.status(400).json({ ok: false, message: '参数不完整' });
    }
    await db.query('DELETE FROM gallery_items WHERE page_name = ? AND item_type = ?', [page, item_type]);
    for (var i = 0; i < items.length; i++) {
      await db.query(
        'INSERT INTO gallery_items (page_name, item_type, sort_order, item_name, image_url) VALUES (?, ?, ?, ?, ?)',
        [page, item_type, i, items[i].name || '', items[i].image || '']
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('保存画廊数据失败：', err);
    res.status(500).json({ ok: false, message: '保存失败' });
  }
});

router.post('/admin/gallery-image', requireLogin, requireAdmin, async (req, res) => {
  try {
    var buf = Buffer.alloc(0);
    req.on('data', function (chunk) { buf = Buffer.concat([buf, chunk]); });
    req.on('end', function () {
      var boundary = '--' + req.headers['content-type'].split('boundary=')[1];
      var parts = buf.toString('binary').split(boundary);
      var fileData = null, fileName = null;
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.indexOf('filename=') >= 0) {
          var headerEnd = part.indexOf('\r\n\r\n');
          var header = part.substring(0, headerEnd);
          fileName = (header.match(/filename="(.+?)"/) || [])[1] || 'image_' + Date.now();
          var bodyStart = headerEnd + 4;
          var bodyEnd = part.lastIndexOf('\r\n');
          if (bodyEnd < 0) bodyEnd = part.length;
          fileData = Buffer.from(part.substring(bodyStart, bodyEnd), 'binary');
        }
      }
      if (!fileData) return res.status(400).json({ ok: false, message: '未找到文件' });
      var ext = path.extname(fileName).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].indexOf(ext) < 0) ext = '.png';
      var saveName = 'gallery_' + Date.now() + ext;
      var savePath = path.join(__dirname, '..', 'public', 'uploads', 'gallery', saveName);
      var dirPath = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(savePath, fileData);
      res.json({ ok: true, url: '/uploads/gallery/' + saveName });
    });
  } catch (err) {
    console.error('上传画廊图片失败：', err);
    res.status(500).json({ ok: false, message: '上传失败' });
  }
});

module.exports = router;
