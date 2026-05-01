const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

async function register({ username, password, repassword }) {
  if (password !== repassword) {
    throw new Error('两次密码不一致！<a href="/register">返回</a>');
  }

  const exists = await userRepository.existsByUsername(username);
  if (exists) {
    throw new Error('账号已存在！<a href="/register">返回</a>');
  }

  const hashPwd = await bcrypt.hash(password, 10);
  await userRepository.createUser(username, hashPwd);
}

async function login({ username, password }) {
  const loginUser = await userRepository.findByUsername(username);
  if (!loginUser) {
    throw new Error('账号不存在！<a href="/login">返回</a>');
  }

  const isValid = await bcrypt.compare(password, loginUser.password);
  if (!isValid) {
    throw new Error('密码错误！<a href="/login">返回</a>');
  }

  return jwt.sign(
    { id: loginUser.id, username: loginUser.username, role: loginUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = {
  register,
  login
};
