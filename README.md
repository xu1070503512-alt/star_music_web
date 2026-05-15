# 小星音吧 (Star Music Web)

NCDA Event Full Stack Music Visualization Website Project

面向音乐创作者与听众的沉浸式音乐平台，提供用户注册/登录、音乐上传（含封面）/播放/收藏、播放量统计、音频频谱可视化（Web Audio API + Canvas）、管理员后台（页面内容编辑 + 画廊管理）以及欢迎页 3D 粒子背景等功能。整体 UI 采用玻璃拟态 (Glassmorphism) 风格，具有丰富的 CSS 动画和原生 JS 交互特效。

---

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 运行时 | Node.js |
| Web 框架 | Express 4.x |
| 模板引擎 | EJS |
| 数据库 | MySQL |
| 数据库驱动 | `mysql2`（Promise 封装） |
| Cookie 解析 | `cookie-parser` |
| 用户认证 | JWT（`jsonwebtoken`）— 通过 HttpOnly Cookie 存储 |
| 密码哈希 | `bcryptjs` |
| 文件上传 | `multer` |
| 环境变量 | `dotenv` |
| 前端 | 原生 JavaScript + CSS3 动画 + Canvas API |

---

## 项目目录结构

```
star_music_web/
├── app.js                     # 应用主入口，Express 配置与中间件注册
├── db.js                      # MySQL 连接池 + 自动迁移 + 种子数据填充
├── package.json               # 项目元数据与依赖声明
├── .env.example               # 环境变量模板
├── CODE_WIKI.md               # 详细代码文档（架构、模块、API、数据库设计）
│
├── routes/                    # 路由处理器（5 个文件）
├── services/                  # 业务逻辑层（2 个文件）
├── repositories/              # 数据访问层（3 个文件）
├── middleware/                 # Express 中间件（auth、upload）
├── views/                     # EJS 视图模板（welcome、app + partials）
├── public/                    # 静态资源（CSS 17个 / JS 17个 / SVG 图标 / uploads/）
│
├── code_example/              # 前端特效代码示例（参考用）
├── plugin_example/            # waveform 插件源码引用
├── scripts/                   # 构建脚本
└── txt/                       # 项目笔记与计划书
```

---

## 环境搭建

### 前置要求

| 软件 | 最低版本 |
|------|---------|
| Node.js | ≥ 18.x |
| MySQL | ≥ 8.0 |

### 步骤

**1. 安装依赖**

```powershell
npm install
```

**2. 配置环境变量**

```powershell
copy .env.example .env
```

编辑 `.env` 填写实际配置：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=star_music
DB_PORT=3306
JWT_SECRET=your_random_secret_string_here
JWT_EXPIRES_IN=7d
```

**3. 创建 MySQL 数据库**

```sql
CREATE DATABASE star_music CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**4. 创建基础数据表**

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE music (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_name VARCHAR(200) NOT NULL,
  singer VARCHAR(200) NOT NULL,
  cover_path VARCHAR(500) NOT NULL,
  mp3_path VARCHAR(500) NOT NULL,
  uploader_id INT NOT NULL,
  play_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id)
);

CREATE TABLE collect (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  music_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (music_id) REFERENCES music(id)
);
```

> `waveform_defaults`、`page_content`、`gallery_items` 三张表以及 `users.nickname` / `users.signature` 字段由 `db.js` 的 `runMigrations()` 在应用启动时自动创建。

**5. 创建上传目录**

```powershell
mkdir public\uploads\covers
mkdir public\uploads\music
mkdir public\uploads\gallery
```

**6. 启动开发服务器**

```powershell
npm run dev
```

服务默认监听 `http://localhost:3000`。

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 生产模式启动 (`node app.js`) |
| `npm run dev` | 开发模式启动 (`nodemon app.js`，文件变更自动重启) |

---

## 页面访问

| 页面 | URL |
|------|-----|
| 欢迎页（含登录/注册） | `http://localhost:3000/` |
| SPA 主应用 | `http://localhost:3000/app` |
| 首页面板 | `http://localhost:3000/home` |
| 个人空间 | `http://localhost:3000/myspace` |
| 可视化面板 | `http://localhost:3000/visualizer` |
| 上传面板（仅管理员） | `http://localhost:3000/upload` |

---

## 角色权限

| 角色 | 权限 |
|------|------|
| 普通用户 (`user`) | 浏览音乐、播放、收藏/取消收藏、可视化 |
| 管理员 (`admin`) | 以上全部 + 上传音乐、删除音乐、编辑页面内容、管理画廊、修改可视化默认设置 |

创建管理员：

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

---

## 核心功能

- 音乐上传（封面 + MP3）、播放、收藏/取消收藏
- 播放量统计
- 音频频谱可视化（Web Audio API + Canvas，60+ 可调参数）
- 管理员后台：页面内容编辑、画廊管理（拖拽排序）
- 欢迎页 3D 粒子背景 + 物理惯性滚动
- 玻璃拟态 UI + 丰富 CSS 动画特效（文本模糊入场、数字递增、无限循环画廊等）

---

## 详细文档

参见 [CODE_WIKI.md](./CODE_WIKI.md) 获取完整的架构设计、模块详述、API 说明和数据库设计文档。
