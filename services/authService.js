const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function register({ username, password, repassword }) {
  if (password !== repassword) {
    throw new AppError('两次密码不一致', 'PASSWORD_MISMATCH', 400);
  }

  const exists = await userRepository.existsByUsername(username);
  if (exists) {
    throw new AppError('账号已存在', 'USERNAME_EXISTS', 409);
  }

  const hashPwd = await bcrypt.hash(password, 10);
  await userRepository.createUser(username, hashPwd);
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      nickname: user.nickname || null,
      signature: user.signature || null
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

async function login({ username, password }) {
  const loginUser = await userRepository.findByUsername(username);
  if (!loginUser) {
    throw new AppError('账号不存在', 'USER_NOT_FOUND', 401);
  }

  const isValid = await bcrypt.compare(password, loginUser.password);
  if (!isValid) {
    throw new AppError('密码错误', 'INVALID_PASSWORD', 401);
  }

  return signToken(loginUser);
}

async function updateProfile(userId, nickname, signature) {
  const cleanNickname = (nickname || '').trim().substring(0, 50);
  const cleanSignature = (signature || '').trim().substring(0, 200);

  await userRepository.updateProfile(userId, cleanNickname || null, cleanSignature || null);

  const freshUser = await userRepository.findById(userId);
  return signToken(freshUser);
}

module.exports = {
  AppError,
  register,
  login,
  updateProfile
};
