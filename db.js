const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

function ensureUploadDirs() {
  const dirs = [
    'public/uploads/covers',
    'public/uploads/music',
    'public/uploads/gallery'
  ];
  dirs.forEach((dir) => {
    const target = path.join(__dirname, dir);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
      console.log('已创建目录：' + dir);
    }
  });
}

function runMigrations() {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(50) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       role VARCHAR(20) NOT NULL DEFAULT 'user',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    "ALTER TABLE users ADD COLUMN nickname VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN signature VARCHAR(200) DEFAULT NULL",
    `CREATE TABLE IF NOT EXISTS music (
       id INT AUTO_INCREMENT PRIMARY KEY,
       song_name VARCHAR(200) NOT NULL,
       singer VARCHAR(200) NOT NULL,
       cover_path VARCHAR(500) DEFAULT NULL,
       mp3_path VARCHAR(500) DEFAULT NULL,
       uploader_id INT,
       play_count INT DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS collect (
       id INT AUTO_INCREMENT PRIMARY KEY,
       user_id INT NOT NULL,
       music_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY uk_user_music (user_id, music_id)
     )`,
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
  seedPageContent();
  seedWaveformDefaults();
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

function seedPageContent() {
  const welcomeContent = {
    heroEyebrow: 'IMMERSIVE INDIE SOUND HUB',
    heroTitle: '让每一次进入，都像踏入一间正在发光的音乐自习室。',
    heroSubtitle: '围绕小众音乐、独立创作者和沉浸式声场，重构你的播放、收藏、发现与表达体验。',
    heroBtnLogin: '进入社区',
    heroBtnRegister: '创建账号',
    heroTag1: '沉浸式声场',
    heroTag2: '独立音乐人',
    heroTag3: '创作协作',
    heroTag4: '动态视觉',
    statsLead: '已有',
    countUpTo: '10000',
    countUpFrom: '0',
    countUpDuration: '2',
    countUpDelay: '0.3',
    countUpDirection: 'up',
    countUpSeparator: ',',
    statsDescriptor: '位用户、独立音乐人加入',
    statsSub: '与我们一起构建一个沉浸式的小众音乐社区。',
    featuredHeader: 'FEATURED ARTISTS',
    featuredSub: '知名音乐人',
    sponsorHeader: 'OUR SPONSORS',
    sponsorSub: '赞助商与合作伙伴'
  };

  const homeContent = {
    homeEyebrow: 'NEON STUDY LOUNGE',
    homeTitle: '让旋律、霓虹与注意力在同一空间里共振。',
    homeSummary: '围绕独立音乐、深夜创作和高质感播放体验，构建一个既能沉浸聆听，又能高效管理的声场社区。',
    filterAll: '全部',
    filterCollected: '已收藏',
    filterUncollected: '未收藏',
    filterPopular: '热门优先'
  };

  const myspaceContent = {
    myspaceEyebrow: 'CREATOR PROFILE'
  };

  Object.entries(welcomeContent).forEach(([key, value]) => {
    db.query(
      'INSERT IGNORE INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?)',
      ['welcome', key, value]
    );
  });

  Object.entries(homeContent).forEach(([key, value]) => {
    db.query(
      'INSERT IGNORE INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?)',
      ['home', key, value]
    );
  });

  Object.entries(myspaceContent).forEach(([key, value]) => {
    db.query(
      'INSERT IGNORE INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?)',
      ['myspace', key, value]
    );
  });
}

function seedWaveformDefaults() {
  const defaults = {
    SettingsVersion: 2,
    AudioSource: 'site_player',
    AudioSyncOffset: 0,
    HideWhenSilent: false,
    SilentProcess: false,
    NormalizeVolume: false,
    TargetVolume: -8,
    MaxGain: 30,
    DisplayMode: 'curve',
    RenderMode: 'solid',
    ColorBase: '#FFFFFFFF',
    ColorCrest: '#FFFFFFFF',
    ColorMiddle: '#FFFFFFFF',
    Width: 800,
    Height: 225,
    logScale: true,
    mirrorFreqAxis: false,
    RadialLayout: false,
    RadialInvert: false,
    Deadzone: 20,
    RadialArc: 360,
    RadialRotation: 0,
    BarWidth: 24,
    BarGap: 6,
    StepWidth: 8,
    StepGap: 4,
    MinBarH: 0,
    RoundedCaps: false,
    ChannelMode: 'mono',
    Channel: 0,
    ChannelSpacing: 0,
    AutoFftSize: false,
    EnableLargeFft: false,
    FftSize: 4096,
    WindowFunc: 'hann',
    SineExponent: 2,
    InterpMode: 'catmull_rom',
    FilterMode: 'none',
    FilterRadius: 1.5,
    CutoffLow: 30,
    CutoffHigh: 17500,
    Floor: -65,
    Ceiling: 0,
    Slope: 0,
    RolloffQ: 0,
    RolloffRate: 0,
    TemporalSmoothing: 'exp_moving_avg',
    Gravity: 0.65,
    FastPeaks: false,
    MeterBufferMs: 150,
    RmsMode: true,
    PulseMode: 'peak_magnitude',
    RangeMiddle: -20,
    RangeCrest: -9,
    GradRatio: 0.75
  };

  db.query(
    'INSERT IGNORE INTO waveform_defaults (id, settings) VALUES (1, ?)',
    [JSON.stringify(defaults)]
  );
}

db.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败：', err.message);
    return;
  }
  console.log('数据库连接成功');
  connection.release();
  ensureUploadDirs();
  runMigrations();
});

module.exports = db.promise();
