const jwt = require('jsonwebtoken');

function requireLogin(req, res, next) {
  // 支持小程序通过 Authorization header 传递 token
  var token = req.cookies.token;
  if (!token && req.headers.authorization) {
    var parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    // 如果是 API 请求返回 JSON，否则重定向
    if (req.path.startsWith('/api/miniapp/')) {
      return res.status(401).json({ status: 'error', msg: '未登录' });
    }
    return res.redirect('/?auth=login');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (req.path.startsWith('/api/miniapp/')) {
      return res.status(401).json({ status: 'error', msg: '登录已过期' });
    }
    res.clearCookie('token');
    res.redirect('/?auth=login');
  }
}

function detectLogin(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      res.clearCookie('token');
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.send('权限不足！仅管理员可访问');
}

module.exports = {
  requireLogin,
  detectLogin,
  requireAdmin
};
