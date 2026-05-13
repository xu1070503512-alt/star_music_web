const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

function runMigrations() {
  const migrations = [
    "ALTER TABLE users ADD COLUMN nickname VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN signature VARCHAR(200) DEFAULT NULL",
    `CREATE TABLE IF NOT EXISTS waveform_defaults (
       id INT PRIMARY KEY DEFAULT 1,
       settings JSON NOT NULL,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       CHECK (id = 1)
     )`,
    `CREATE TABLE IF NOT EXISTS page_content (
       id INT AUTO_INCREMENT PRIMARY KEY,
       page_name VARCHAR(50) NOT NULL,
       content_key VARCHAR(80) NOT NULL,
       content_value TEXT,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uk_page_key (page_name, content_key)
     )`,
    `CREATE TABLE IF NOT EXISTS gallery_items (
       id INT AUTO_INCREMENT PRIMARY KEY,
       page_name VARCHAR(50) NOT NULL DEFAULT 'welcome',
       item_type VARCHAR(20) NOT NULL,
       sort_order INT NOT NULL DEFAULT 0,
       item_name VARCHAR(100) NOT NULL DEFAULT '',
       image_url VARCHAR(500) NOT NULL DEFAULT '',
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uk_gallery_item (page_name, item_type, sort_order)
     )`
  ];
  migrations.forEach((sql) => {
    db.query(sql, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_ENTRY') {
        console.warn('迁移提示：', err.message);
      }
    });
  });

  seedGallery();
}

function seedGallery() {
  const artists = [
    ['Aurora Wave', 'https://picsum.photos/seed/artist1/400/520?grayscale'],
    ['Neon Drift', 'https://picsum.photos/seed/artist2/400/520?grayscale'],
    ['Luna Echo', 'https://picsum.photos/seed/artist3/400/520?grayscale'],
    ['Solstice', 'https://picsum.photos/seed/artist4/400/520?grayscale'],
    ['Velvet Noise', 'https://picsum.photos/seed/artist5/400/520?grayscale'],
    ['Ember Tide', 'https://picsum.photos/seed/artist6/400/520?grayscale'],
    ['Pixel Glow', 'https://picsum.photos/seed/artist7/400/520?grayscale'],
    ['Starfall', 'https://picsum.photos/seed/artist8/400/520?grayscale']
  ];
  const sponsors = [
    ['SoundCloud', 'linear-gradient(135deg, #ff4f9a, #ff9f4f)'],
    ['Bandcamp', 'linear-gradient(135deg, #7c5cff, #19d3ff)'],
    ['Spotify', 'linear-gradient(135deg, #19d3ff, #7c5cff)'],
    ['Apple Music', 'linear-gradient(135deg, #ff9f4f, #ff4f9a)'],
    ['Tidal', 'linear-gradient(135deg, #7c5cff, #ff4f9a)'],
    ['Deezer', 'linear-gradient(135deg, #19d3ff, #ff9f4f)'],
    ['Ableton', 'linear-gradient(135deg, #ff4f9a, #7c5cff)'],
    ['Splice', 'linear-gradient(135deg, #7c5cff, #19d3ff)']
  ];

  artists.forEach(function (a, i) {
    db.query(
      'INSERT IGNORE INTO gallery_items (page_name, item_type, sort_order, item_name, image_url) VALUES (?, ?, ?, ?, ?)',
      ['welcome', 'artist', i, a[0], a[1]]
    );
  });
  sponsors.forEach(function (s, i) {
    db.query(
      'INSERT IGNORE INTO gallery_items (page_name, item_type, sort_order, item_name, image_url) VALUES (?, ?, ?, ?, ?)',
      ['welcome', 'sponsor', i, s[0], s[1]]
    );
  });
}

db.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败：', err.message);
    return;
  }
  console.log('数据库连接成功');
  connection.release();
  runMigrations();
});

module.exports = db.promise();
