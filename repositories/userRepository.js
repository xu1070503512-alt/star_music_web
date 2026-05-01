const db = require('../db');

async function findByUsername(username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function existsByUsername(username) {
  const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
  return rows.length > 0;
}

async function createUser(username, password) {
  return db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
}

module.exports = {
  findByUsername,
  existsByUsername,
  createUser
};
