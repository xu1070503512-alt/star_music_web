const express = require('express');
const authService = require('../services/authService');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    await authService.register(req.body);
    res.redirect('/login');
  } catch (err) {
    const knownMessages = new Set([
      '两次密码不一致！<a href="/register">返回</a>',
      '账号已存在！<a href="/register">返回</a>'
    ]);

    if (knownMessages.has(err.message)) {
      return res.send(err.message);
    }

    console.error('注册失败：', err);
    res.send('注册失败！');
  }
});

router.post('/login', async (req, res) => {
  try {
    const token = await authService.login(req.body);
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/home');
  } catch (err) {
    const knownMessages = new Set([
      '账号不存在！<a href="/login">返回</a>',
      '密码错误！<a href="/login">返回</a>'
    ]);

    if (knownMessages.has(err.message)) {
      return res.send(err.message);
    }

    console.error('登录失败：', err);
    res.send('登录失败！');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
