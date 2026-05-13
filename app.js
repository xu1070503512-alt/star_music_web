require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const musicRoutes = require('./routes/musicRoutes');
const waveformRoutes = require('./routes/waveformRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/api', musicRoutes);
app.use('/api', waveformRoutes);
app.use('/api', adminRoutes);

app.use((req, res) => {
  res.status(404).send('页面不存在');
});

app.use((err, req, res, next) => {
  console.error('服务器错误：', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).send('文件大小超出限制');
  }
  if (err.message && err.message.includes('仅支持')) {
    return res.status(400).send(err.message);
  }
  res.status(500).send('服务器内部错误，请稍后重试');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动：http://localhost:${PORT}`);
});
