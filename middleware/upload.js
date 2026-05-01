const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, './public/uploads/covers');
    } else {
      cb(null, './public/uploads/music');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

module.exports = multer({ storage });
