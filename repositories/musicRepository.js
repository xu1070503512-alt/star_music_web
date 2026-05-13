const db = require('../db');

const MUSIC_SELECT = `
  SELECT
    m.*,
    COALESCE(u.nickname, u.username, '独立音乐人') AS uploader_name,
    COALESCE(u.role, 'user') AS uploader_role
  FROM music m
  LEFT JOIN users u ON u.id = m.uploader_id
`;

async function getAllMusic() {
  const [rows] = await db.query(`${MUSIC_SELECT} ORDER BY m.created_at DESC`);
  return rows;
}

async function getAllMusicPaged(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [rows] = await db.query(
    `${MUSIC_SELECT} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM music');
  return { rows, total, page, pageSize };
}

async function getUploadedByUser(userId) {
  const [rows] = await db.query(
    `${MUSIC_SELECT} WHERE m.uploader_id = ? ORDER BY m.created_at DESC`,
    [userId]
  );
  return rows;
}

async function findById(musicId) {
  const [rows] = await db.query(`${MUSIC_SELECT} WHERE m.id = ?`, [musicId]);
  return rows[0] || null;
}

async function createMusic(songName, singer, coverPath, musicPath, uploaderId) {
  return db.query(
    'INSERT INTO music (song_name, singer, cover_path, mp3_path, uploader_id) VALUES (?, ?, ?, ?, ?)',
    [songName, singer, coverPath, musicPath, uploaderId]
  );
}

async function incrementPlayCount(musicId) {
  await db.query('UPDATE music SET play_count = COALESCE(play_count, 0) + 1 WHERE id = ?', [musicId]);
  const [rows] = await db.query('SELECT play_count FROM music WHERE id = ?', [musicId]);
  return rows[0] ? rows[0].play_count : null;
}

async function deleteById(musicId) {
  return db.query('DELETE FROM music WHERE id = ?', [musicId]);
}

module.exports = {
  getAllMusic,
  getAllMusicPaged,
  getUploadedByUser,
  findById,
  createMusic,
  incrementPlayCount,
  deleteById
};
