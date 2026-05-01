const db = require('../db');

async function getCollectedIdsByUser(userId) {
  const [rows] = await db.query('SELECT music_id FROM collect WHERE user_id = ?', [userId]);
  return rows;
}

async function getCollectedMusicByUser(userId) {
  const [rows] = await db.query(
    `
      SELECT
        m.*,
        c.created_at AS collected_at,
        COALESCE(u.nickname, u.username, '独立音乐人') AS uploader_name
      FROM music m
      INNER JOIN collect c ON m.id = c.music_id
      LEFT JOIN users u ON u.id = m.uploader_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `,
    [userId]
  );

  return rows;
}

async function exists(userId, musicId) {
  const [rows] = await db.query('SELECT id FROM collect WHERE user_id = ? AND music_id = ?', [userId, musicId]);
  return rows.length > 0;
}

async function create(userId, musicId) {
  return db.query('INSERT INTO collect (user_id, music_id) VALUES (?, ?)', [userId, musicId]);
}

async function deleteOne(userId, musicId) {
  return db.query('DELETE FROM collect WHERE user_id = ? AND music_id = ?', [userId, musicId]);
}

async function deleteByMusicId(musicId) {
  return db.query('DELETE FROM collect WHERE music_id = ?', [musicId]);
}

module.exports = {
  getCollectedIdsByUser,
  getCollectedMusicByUser,
  exists,
  create,
  deleteOne,
  deleteByMusicId
};
