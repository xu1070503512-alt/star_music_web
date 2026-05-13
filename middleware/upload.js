const multer = require('multer');
const path = require('path');

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_MUSIC_TYPES = ['audio/mpeg', 'audio/mp3'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, './public/uploads/covers');
    } else {
      cb(null, './public/uploads/music');
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

function fileFilter(req, file, cb) {
  if (file.fieldname === 'cover') {
    if (!ALLOWED_COVER_TYPES.includes(file.mimetype)) {
      return cb(new Error('封面仅支持 JPG/PNG/WebP/GIF 格式'));
    }
    cb(null, true);
  } else if (file.fieldname === 'music') {
    if (!ALLOWED_MUSIC_TYPES.includes(file.mimetype)) {
      return cb(new Error('音频仅支持 MP3 格式'));
    }
    cb(null, true);
  } else {
    cb(null, false);
  }
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});
