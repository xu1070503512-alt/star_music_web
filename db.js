// 加载.env环境变量配置
require('dotenv').config();

// 引入mysql2数据库驱动
const mysql = require('mysql2');

// 创建数据库连接池（课程项目够用、稳定，不搞冗余配置）
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

// 测试数据库连接是否成功
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ 数据库连接失败：', err.message);
    return;
  }
  console.log('✅ 数据库连接成功！');
  connection.release(); // 释放连接，避免占用
});

// 导出Promise版本的连接，方便后端异步操作
module.exports = db.promise();