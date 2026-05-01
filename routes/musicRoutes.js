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
      res.send('上传成功！<a href="/home">返回主页</a>');
    } catch (err) {
      console.error('上传失败：', err);
      res.send(err.message === '歌曲信息不完整' || err.message === '上传文件不完整' ? err.message : '上传失败！');
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
    return res.json({ status: 'error', msg: err.message || '收藏失败' });
  }
});

router.post('/uncollect', requireLogin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    await musicService.uncollect(req.user.id, musicId);
    res.json({ status: 'success', msg: '取消收藏成功' });
  } catch (err) {
    console.error('取消收藏失败：', err);
    res.json({ status: 'error', msg: err.message || '操作失败' });
  }
});

router.post('/track_play', requireLogin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    const playCount = await musicService.incrementPlayCount(musicId);
    res.json({ status: 'success', msg: '播放量已更新', playCount });
  } catch (err) {
    console.error('更新播放量失败：', err);
    res.json({ status: 'error', msg: err.message || '更新失败' });
  }
});

router.post('/delete_music', requireLogin, requireAdmin, async (req, res) => {
  try {
    const musicId = getMusicIdFromRequest(req);
    await musicService.deleteMusic(musicId);
    res.json({ status: 'success', msg: '删除成功' });
  } catch (err) {
    console.error('删除歌曲失败：', err);
    res.json({ status: 'error', msg: err.message || '删除失败' });
  }
});

module.exports = router;
