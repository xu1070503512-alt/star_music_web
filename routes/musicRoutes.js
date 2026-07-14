const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const musicService = require('../services/musicService');

const router = express.Router();

function getMusicIdFromRequest(req) {
  return req.body ? req.body.music_id : undefined;
}

router.post(
  '/upload',
  requireLogin,
  requireAdmin,
  upload.fields([{ name: 'cover' }, { name: 'music' }]),
  async (req, res) => {
    try {
      await musicService.uploadMusic(req.body, req.files, req.user);
      res.redirect('/app?page=home');
    } catch (err) {
      console.error('上传失败：', err);
      res.status(400).send(`上传失败：${err.message}`);
    }
  }
);

router.post('/star_collect', requireLogin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    await musicService.collect(req.user.id, musicId);
    return res.json({ status: 'success', msg: '收藏成功！' });
  } catch (err) {
    console.error('收藏失败：', err);
    return res.status(400).json({ status: 'error', msg: err.message || '收藏失败' });
  }
});

router.post('/uncollect', requireLogin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    await musicService.uncollect(req.user.id, musicId);
    res.json({ status: 'success', msg: '取消收藏成功' });
  } catch (err) {
    console.error('取消收藏失败：', err);
    res.status(400).json({ status: 'error', msg: err.message || '操作失败' });
  }
});

router.post('/track_play', requireLogin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    const playCount = await musicService.incrementPlayCount(musicId);
    res.json({ status: 'success', msg: '播放量已更新', playCount });
  } catch (err) {
    console.error('更新播放量失败：', err);
    res.status(500).json({ status: 'error', msg: err.message || '更新失败' });
  }
});

// 获取音乐列表（小程序用）
router.get('/music', async (req, res) => {
  try {
    const musicList = await musicService.getHomePageData({ id: 0 });
    res.json({ status: 'success', data: musicList.musicList });
  } catch (err) {
    console.error('获取音乐列表失败：', err);
    res.status(500).json({ status: 'error', msg: '获取失败' });
  }
});

// 获取收藏列表（小程序用）
router.get('/miniapp/collect', requireLogin, async (req, res) => {
  try {
    const collectRepository = require('../repositories/collectRepository');
    const collectList = await collectRepository.getCollectedMusicByUser(req.user.id);
    res.json({ status: 'success', data: collectList });
  } catch (err) {
    console.error('获取收藏列表失败：', err);
    res.status(500).json({ status: 'error', msg: '获取失败' });
  }
});

// 获取欢迎页数据（小程序用：page_content + gallery_items）
router.get('/miniapp/welcome', async (req, res) => {
  try {
    const db = require('../db');
    var pageContent = {};
    var galleryData = { artist: [], sponsor: [] };
    try {
      const [rows] = await db.query('SELECT content_key, content_value FROM page_content WHERE page_name = ?', ['welcome']);
      rows.forEach(function (r) { pageContent[r.content_key] = r.content_value; });
    } catch (e) { console.warn('page_content query failed:', e.message); }
    try {
      const [gRows] = await db.query('SELECT item_type, sort_order, item_name, image_url FROM gallery_items WHERE page_name = ? ORDER BY item_type, sort_order', ['welcome']);
      gRows.forEach(function (r) {
        if (!galleryData[r.item_type]) galleryData[r.item_type] = [];
        galleryData[r.item_type].push({ name: r.item_name, image: r.image_url });
      });
    } catch (e) { console.warn('gallery_items query failed:', e.message); }
    res.json({ status: 'success', pageContent: pageContent, galleryData: galleryData });
  } catch (err) {
    console.error('获取欢迎页数据失败：', err);
    res.status(500).json({ status: 'error', msg: '获取失败' });
  }
});

router.post('/delete_music', requireLogin, requireAdmin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    await musicService.deleteMusic(musicId);
    res.json({ status: 'success', msg: '删除成功' });
  } catch (err) {
    console.error('删除歌曲失败：', err);
    res.status(500).json({ status: 'error', msg: err.message || '删除失败' });
  }
});

module.exports = router;
