const db = require('../db');

async function findByUsername(username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function existsByUsername(username) {
  const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
  return rows.length > 0;
}

async function createUser(username, password) {
  return db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
}

async function updateProfile(id, nickname, signature) {
  return db.query('UPDATE users SET nickname = ?, signature = ? WHERE id = ?', [nickname, signature, id]);
}

module.exports = {
  findByUsername,
  findById,
  existsByUsername,
  createUser,
  updateProfile
};
