const express = require('express');
const { requireLogin } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

router.post('/register', async (req, res) => {
  try {
    await authService.register(req.body);
    res.redirect('/?registered=1');
  } catch (err) {
    if (err instanceof authService.AppError) {
      return res.redirect(`/?auth=register&error=${encodeURIComponent(err.message)}`);
    }
    console.error('注册失败：', err);
    res.status(500).send('注册失败，请稍后重试');
  }
});

router.post('/login', async (req, res) => {
  try {
    const token = await authService.login(req.body);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect('/home');
  } catch (err) {
    if (err instanceof authService.AppError) {
      return res.redirect(`/?auth=login&error=${encodeURIComponent(err.message)}`);
    }
    console.error('登录失败：', err);
    res.status(500).send('登录失败，请稍后重试');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

router.put('/user/profile', requireLogin, async (req, res) => {
  try {
    const { nickname, signature } = req.body;
    const token = await authService.updateProfile(req.user.id, nickname, signature);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ ok: true });
  } catch (err) {
    console.error('更新资料失败：', err);
    res.status(500).json({ ok: false, message: '更新失败' });
  }
});

module.exports = router;
