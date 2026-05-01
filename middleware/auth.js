const jwt = require('jsonwebtoken');

function requireLogin(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.send('权限不足！仅管理员可访问');
}

module.exports = {
  requireLogin,
  requireAdmin
};
