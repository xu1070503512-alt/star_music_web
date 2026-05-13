const jwt = require('jsonwebtoken');

function requireLogin(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/?auth=login');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
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
