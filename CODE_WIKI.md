# Star Music Web — Code Wiki

> 生成日期：2026-05-14 | 项目类型：Node.js + Express + EJS 全栈 Web 应用

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目目录结构](#3-项目目录结构)
4. [系统架构](#4-系统架构)
   - [4.1 分层架构设计](#41-分层架构设计)
   - [4.2 请求处理流程](#42-请求处理流程)
5. [模块详述](#5-模块详述)
   - [5.1 应用入口 — app.js](#51-应用入口--appjs)
   - [5.2 数据库连接 — db.js](#52-数据库连接--dbjs)
   - [5.3 路由层 — routes/](#53-路由层--routes)
   - [5.4 服务层 — services/](#54-服务层--services)
   - [5.5 数据访问层 — repositories/](#55-数据访问层--repositories)
   - [5.6 中间件 — middleware/](#56-中间件--middleware)
   - [5.7 视图层 — views/](#57-视图层--views)
   - [5.8 前端静态资源 — public/](#58-前端静态资源--public)
6. [关键类与函数说明](#6-关键类与函数说明)
   - [6.1 路由处理函数](#61-路由处理函数)
   - [6.2 服务层函数](#62-服务层函数)
   - [6.3 数据访问层函数](#63-数据访问层函数)
   - [6.4 中间件函数](#64-中间件函数)
   - [6.5 前端核心模块](#65-前端核心模块)
7. [数据库设计](#7-数据库设计)
8. [依赖关系](#8-依赖关系)
   - [8.1 运行时依赖](#81-运行时依赖)
   - [8.2 模块间依赖图](#82-模块间依赖图)
9. [项目运行方式](#9-项目运行方式)
   - [9.1 本地开发环境搭建](#91-本地开发环境搭建)
   - [9.2 生产部署](#92-生产部署)
10. [前端特效系统](#10-前端特效系统)

---

## 1. 项目概述

**Star Music Web（小星音吧）** 是一个面向音乐创作者与听众的沉浸式音乐平台。提供用户注册/登录、音乐上传（含封面）/播放/收藏、播放量统计、音频频谱可视化（Web Audio API + Canvas）、管理员后台（页面内容编辑 + 画廊管理）以及欢迎页 3D 粒子背景等功能。整体 UI 采用玻璃拟态 (Glassmorphism) 风格，具有丰富的 CSS 动画和原生 JS 交互特效。

---

## 2. 技术栈

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

## 3. 项目目录结构

```
star_music_web/
├── app.js                           # 应用主入口，Express 配置与中间件注册
├── db.js                            # MySQL 连接池 + 自动迁移 + 种子数据填充
├── package.json                     # 项目元数据与依赖声明
├── .env.example                     # 环境变量模板
├── cookies.txt                      # Cookie 相关说明
│
├── routes/                          # 路由处理器
│   ├── pageRoutes.js                # 页面路由（首页、欢迎页、SPA 主应用）
│   ├── authRoutes.js                # 认证路由（注册、登录、登出、个人资料）
│   ├── musicRoutes.js               # 音乐路由（上传、收藏、播放统计、删除）
│   ├── adminRoutes.js               # 管理员路由（页面内容、画廊管理）
│   └── waveformRoutes.js            # 可视化设置路由（读取/保存频谱配置）
│
├── services/                        # 业务逻辑层
│   ├── authService.js               # 认证服务
│   └── musicService.js              # 音乐服务
│
├── repositories/                    # 数据访问层
│   ├── userRepository.js            # 用户数据访问
│   ├── musicRepository.js           # 音乐数据访问
│   └── collectRepository.js         # 收藏数据访问
│
├── middleware/                       # Express 中间件
│   ├── auth.js                      # JWT Cookie 认证中间件
│   └── upload.js                    # 文件上传中间件（multer 配置）
│
├── views/                           # EJS 视图模板
│   ├── welcome.ejs                  # 欢迎页（粒子 3D 背景 + Hero 面板，内嵌登录/注册弹窗）
│   ├── app.ejs                      # SPA 主应用页（四个可切换面板）
│   └── _partials/                   # 模板片段
│       ├── viz_js_new.ejs           # 频谱可视化 JS（嵌入 app.ejs）
│       └── viz_panel_new.ejs        # 频谱可视化面板 HTML（嵌入 app.ejs）
│
├── public/                          # 静态资源
│   ├── css/                         # 样式表（18 个文件）
│   │   ├── base.css                 # CSS 变量 / 全局重置 / 排版基础
│   │   ├── components.css           # 通用组件（按钮、卡片、表单、弹窗）
│   │   ├── responsive.css           # 响应式断点
│   │   ├── welcome.css              # 欢迎页样式
│   │   ├── home.css                 # 首页 Hero 样式
│   │   ├── login.css                # 登录卡片样式
│   │   ├── register.css             # 注册卡片样式
│   │   ├── visualizer-panel.css     # 可视化面板样式
│   │   ├── myspace.css              # 个人空间样式
│   │   ├── upload.css               # 上传界面样式
│   │   ├── admin-console.css        # 管理员后台样式
│   │   ├── card-nav.css             # 卡片导航样式
│   │   ├── blur-text.css            # 字符入场模糊效果
│   │   ├── gradual-blur.css         # 渐进式模糊效果
│   │   ├── scroll-float.css         # 滚动漂浮入场效果
│   │   ├── circular-gallery.css     # 无限循环画廊样式
│   │   ├── logo-loop.css            # Logo 循环滚动样式
│   │   ├── count-up.css             # 数字递增样式
│   │   └── index.css                # 额外索引样式
│   │
│   ├── js/                          # 客户端脚本（17 个文件）
│   │   ├── app-switcher.js          # SPA 面板切换引擎
│   │   ├── home.js                  # 首页交互（推荐区域、通知）
│   │   ├── admin-console.js         # 管理员后台操作
│   │   ├── myspace.js               # 个人空间（Tab、收藏管理）
│   │   ├── welcome.js               # 欢迎页物理惯性滚动
│   │   ├── welcome-3d.js            # 欢迎页 Canvas 3D 粒子背景
│   │   ├── visualizer-waveform.js   # 音频频谱可视化引擎
│   │   ├── visualizer-controls.js   # 频谱参数控制面板
│   │   ├── card-nav.js              # 汉堡菜单卡片导航
│   │   ├── blur-text.js             # 文本入场模糊动画
│   │   ├── gradual-blur.js          # 渐进式模糊效果
│   │   ├── count-up.js              # 数字滚动递增动画
│   │   ├── scroll-float.js          # 滚动漂浮入场效果
│   │   ├── circular-gallery.js      # 无限循环卡片画廊
│   │   ├── logo-loop.js             # Logo 循环滚动
│   │   ├── magic-rings.js           # 光环特效
│   │   └── physics-scroll.js        # 物理惯性滚动通用模块
│   │
│   └── uploads/                     # 上传文件存储（运行时生成）
│       ├── covers/                  # 封面图片
│       ├── music/                   # 音乐文件（MP3）
│       └── gallery/                 # 画廊图片
```

---

## 4. 系统架构

### 4.1 分层架构设计

项目采用经典的 **三层架构（Three-Tier Architecture）**：

```
┌──────────────────────────────────────────────────┐
│                  视图层（Views）                    │
│            EJS 模板 + 静态前端资源                  │
├──────────────────────────────────────────────────┤
│                  路由层（Routes）                   │
│   pageRoutes / authRoutes / musicRoutes           │
│         adminRoutes / waveformRoutes              │
├──────────────────────────────────────────────────┤
│                 服务层（Services）                  │
│          authService / musicService               │
├──────────────────────────────────────────────────┤
│             数据访问层（Repositories）               │
│  userRepository / musicRepository                 │
│            collectRepository                      │
├──────────────────────────────────────────────────┤
│                 数据层（Data）                      │
│            MySQL 数据库 + 文件系统                  │
└──────────────────────────────────────────────────┘
```

**层次职责：**

| 层次 | 职责 | 文件 |
|------|------|------|
| 视图层 | 渲染 HTML 页面，展示数据，前端交互逻辑 | `views/*.ejs`, `public/js/*.js`, `public/css/*.css` |
| 路由层 | 接收 HTTP 请求，参数校验，调用服务层，返回响应 | `routes/*.js` |
| 服务层 | 核心业务逻辑，参数合法性检查，协调多个数据源 | `services/*.js` |
| 数据访问层 | 封装 SQL 查询，提供数据 CRUD 接口 | `repositories/*.js` |
| 数据层 | 持久化存储 | MySQL + 文件系统（`public/uploads/`） |

### 4.2 请求处理流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌───────┐
│  浏览器   │────▶│  路由层   │────▶│  服务层   │────▶│ 数据访问层    │────▶│ MySQL │
│ (Client)  │◀────│ (Routes) │◀────│(Services)│◀────│(Repositories)│◀────│+Files │
└──────────┘     └──────────┘     └──────────┘     └──────────────┘     └───────┘
      ▲                │
      │                ▼
      │         ┌──────────┐
      └─────────│  中间件   │
                │(Middleware)│
                └──────────┘
```

以"用户收藏一首音乐"为例：

1. 前端 `POST /api/star_collect`，浏览器自动携带 HttpOnly Cookie（含 JWT Token）
2. `middleware/auth.js` 的 `requireLogin` 验证 Cookie 中的 Token，将 `req.user` 注入请求
3. `routes/musicRoutes.js` 从 `req.body` 解析 `music_id`
4. `services/musicService.js` 检查参数合法性，调用 `collectRepository.exists()` 去重
5. `repositories/collectRepository.js` 执行 SQL INSERT
6. 返回 JSON 响应给前端

---

## 5. 模块详述

### 5.1 应用入口 — app.js

[app.js](file:///d:/Projects/star_music_web/app.js) 是整个应用的启动入口，核心职责：

**中间件注册顺序：**

```javascript
require('dotenv').config();                      // 1. 加载 .env 环境变量
app.use(express.json());                         // 2. 解析 JSON Body
app.use(express.urlencoded({ extended: true }));  // 3. 解析 URL-encoded Body
app.use(cookieParser());                         // 4. 解析 Cookie（用于 JWT 认证）
app.use(express.static('public'));               // 5. 静态文件服务
app.set('view engine', 'ejs');                   // 6. 设置模板引擎
app.set('views', 'views/');                      // 7. 设置视图目录
```

**路由注册：**

```javascript
app.use('/',      pageRoutes);     // 页面路由（根路径，无前缀）
app.use('/api',   authRoutes);     // 认证 API → /api/register, /api/login ...
app.use('/api',   musicRoutes);    // 音乐 API → /api/star_collect, /api/upload ...
app.use('/api',   waveformRoutes); // 可视化设置 → /api/waveform/settings
app.use('/api',   adminRoutes);    // 管理员 → /api/admin/page-content, ...
```

所有 API 路由统一挂载在 `/api` 前缀下，页面路由在根路径 `/` 下。

**错误处理中间件：**

```javascript
app.use((req, res) => {                          // 404 处理
  res.status(404).send('页面不存在');
});

app.use((err, req, res, next) => {               // 全局错误处理
  if (err.code === 'LIMIT_FILE_SIZE')             // multer 文件过大
    return res.status(413).send('文件大小超出限制');
  if (err.message && err.message.includes('仅支持')) // multer 类型不匹配
    return res.status(400).send(err.message);
  res.status(500).send('服务器内部错误，请稍后重试');
});
```

**启动方式：**

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动：http://localhost:${PORT}`);
});
```

项目也配置了 `package.json` 中的 `"start": "node app.js"` 和 `"dev": "nodemon app.js"` 启动脚本。

**环境变量（`.env`）：**

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `PORT` | 服务监听端口 | `3000` |
| `DB_HOST` | MySQL 主机 | `localhost` |
| `DB_USER` | 数据库用户 | `root` |
| `DB_PASSWORD` | 数据库密码 | `your_password_here` |
| `DB_NAME` | 数据库名称 | `star_music` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `JWT_SECRET` | JWT 签名密钥 | `your_jwt_secret_here` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |

### 5.2 数据库连接 — db.js

[db.js](file:///d:/Projects/star_music_web/db.js) 使用 `mysql2` 创建连接池，并导出 Promise 封装接口。

**连接池创建：**

```javascript
const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});
```

**核心特点：**

- 导出 `db.promise()`，所有 repository 层可以使用 `await db.query(sql, params)` 语法，返回 `[rows, fields]` 格式
- 连接时自动执行连接测试，失败打印错误但不会终止进程
- 内置 `runMigrations()` 自动迁移函数，启动时执行：
  - 为 `users` 表添加 `nickname VARCHAR(50)` 和 `signature VARCHAR(200)` 字段（ALTER TABLE，重复执行静默忽略）
  - 创建 `waveform_defaults` 表——存储频谱可视化默认参数（单行，id=1）
  - 创建 `page_content` 表——存储各页面可编辑内容（主页标题、描述等）
  - 创建 `gallery_items` 表——存储画廊展示的艺术家和赞助商数据
- 内置 `seedGallery()` 种子数据填充：自动创建 8 位艺术家 + 8 个赞助商的默认画廊数据（使用 `INSERT IGNORE`）
- 迁移错误静默处理：仅对 `ER_DUP_FIELDNAME`（字段已存在）和 `ER_DUP_ENTRY`（数据已存在）不报警

### 5.3 路由层 — routes/

#### 5.3.1 pageRoutes.js — 页面路由

[pageRoutes.js](file:///d:/Projects/star_music_web/routes/pageRoutes.js) 负责渲染 EJS 视图，挂载于根路径 `/`。

| 路由 | 方法 | 中间件 | 说明 |
|------|------|--------|------|
| `/` | GET | `detectLogin` | 欢迎页，从 `page_content` 和 `gallery_items` 表加载数据 |
| `/login` | GET | — | 重定向到 `/?auth=login` |
| `/register` | GET | — | 重定向到 `/?auth=register` |
| `/app` | GET | `requireLogin` | SPA 主应用页，通过 `?page=` 控制面板 |
| `/home` | GET | `requireLogin` | 重定向到 `/app?page=home` |
| `/myspace` | GET | `requireLogin` | 重定向到 `/app?page=myspace` |
| `/upload` | GET | `requireLogin, requireAdmin` | 重定向到 `/app?page=upload` |
| `/visualizer` | GET | `requireLogin` | 重定向到 `/app?page=visualizer` |

**`/app` 路由的 SPA 设计：**

该路由通过 `?page=` 查询参数控制当前面板（home / myspace / visualizer / upload），服务端并行查询多个数据源：

```
1. 校验 upload 面板的访问权限（仅 admin 角色）
2. Promise.all 并行查询：
   a. musicService.getHomePageData(user)   → 音乐列表 + 收藏 + 社区统计
   b. musicService.getMyspaceData(user)    → 收藏列表 + 上传列表
   c. userRepository.findById(user.id)     → 完整用户信息（含 nickname/signature）
3. 从 page_content 表加载各面板的可编辑文字内容
4. 合并 nickname/signature 到 user 对象
5. 渲染 app.ejs
```

前端通过 `app-switcher.js` 实现四个面板的无刷新横向滑动切换。上传面板仅对管理员开放，非管理员访问 `/app?page=upload` 返回 403。

#### 5.3.2 authRoutes.js — 认证路由

[authRoutes.js](file:///d:/Projects/star_music_web/routes/authRoutes.js) 挂载在 `/api` 前缀下，处理用户认证与资料管理。

| 路由 | 方法 | 中间件 | 说明 |
|------|------|--------|------|
| `/api/register` | POST | — | 用户注册，成功重定向至 `/?registered=1` |
| `/api/login` | POST | — | 用户登录，设置 Cookie 后重定向至 `/home` |
| `/api/logout` | GET | — | 清除 Cookie，重定向至 `/` |
| `/api/user/profile` | PUT | `requireLogin` | 更新昵称和签名，重新签发 JWT |

**认证流程特点：**

- JWT Token 通过 HttpOnly Cookie 传递（防止 XSS 读取），配置为：
  ```javascript
  const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 24 小时
  };
  ```
- 采用传统表单 POST + 重定向模式（非 AJAX），注册/登录成功后执行页面跳转
- 错误信息通过 URL 查询参数传递：`/?auth=login&error=密码错误`
- `authService.AppError` 自定义异常类用于区分业务错误（显示友好提示）与系统错误（记录日志 + 500）
- `PUT /api/user/profile` 更新资料后会重新签发包含最新 nickname/signature 的 JWT Token

#### 5.3.3 musicRoutes.js — 音乐路由

[musicRoutes.js](file:///d:/Projects/star_music_web/routes/musicRoutes.js) 挂载在 `/api` 前缀下，提供音乐相关的核心 API。

**辅助函数 `getMusicIdFromRequest`：**
```javascript
function getMusicIdFromRequest(req) {
  return req.body ? req.body.music_id : undefined;
}
```

| 路由 | 方法 | 中间件 | 说明 |
|------|------|--------|------|
| `/api/upload` | POST | `requireLogin, requireAdmin, upload.fields` | 上传音乐文件 + 封面图片 |
| `/api/star_collect` | POST | `requireLogin` | 收藏音乐（去重，重复则返回错误） |
| `/api/uncollect` | POST | `requireLogin` | 取消收藏 |
| `/api/track_play` | POST | `requireLogin` | 记录播放，递增播放量 |
| `/api/delete_music` | POST | `requireLogin, requireAdmin` | 删除音乐（含文件清理 + 级联收藏删除） |

**上传处理（`/api/upload`）：**

使用 `multer` 的 `upload.fields([{ name: 'cover' }, { name: 'music' }])` 同时接收封面图片和音频文件。两个文件分别存储到 `public/uploads/covers/` 和 `public/uploads/music/`。上传成功后重定向到首页。

#### 5.3.4 adminRoutes.js — 管理员路由

[adminRoutes.js](file:///d:/Projects/star_music_web/routes/adminRoutes.js) 挂载在 `/api` 前缀下，所有路由需要 `requireLogin` + `requireAdmin` 双重中间件。

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/admin/page-content` | GET | 读取指定页面的可编辑内容（`?page=welcome`） |
| `/api/admin/page-content` | PUT | 批量保存页面内容（body: `{ page, changes: { key: value } }`），使用 ON DUPLICATE KEY UPDATE |
| `/api/admin/gallery` | GET | 读取指定页面的画廊数据（`?page=welcome`） |
| `/api/admin/gallery` | PUT | 批量替换画廊数据（body: `{ page, item_type, items }`），先 DELETE 再 INSERT |
| `/api/admin/gallery-image` | POST | 上传画廊图片，手动解析 multipart/form-data |

**画廊图片上传（`/api/admin/gallery-image`）的特点：**

该路由不使用 `multer`，而是手动解析 `multipart/form-data` 原始数据流：
1. 通过 `req.on('data')` 和 `req.on('end')` 读取完整请求体到 Buffer
2. 从 `Content-Type` 头提取 boundary 字符串
3. 按 boundary 拆分各部分
4. 查找包含 `filename=` 的部分，提取文件二进制数据和文件名
5. 写入 `public/uploads/gallery/` 目录（按时间戳命名）
6. 返回 JSON `{ ok: true, url: '/uploads/gallery/xxx.png' }`

#### 5.3.5 waveformRoutes.js — 可视化设置路由

[waveformRoutes.js](file:///d:/Projects/star_music_web/routes/waveformRoutes.js) 挂载在 `/api` 前缀下，管理频谱可视化的参数配置。

| 路由 | 方法 | 中间件 | 说明 |
|------|------|--------|------|
| `/api/waveform/settings` | GET | `requireLogin` | 获取当前可视化默认设置 |
| `/api/waveform/settings` | PUT | `requireLogin, requireAdmin` | 保存可视化默认设置（仅管理员） |

**默认设置对象（`DEFAULT_SETTINGS`）：**

代码中硬编码了超过 60 个可视化参数，包括：
- 渲染模式：`DisplayMode: 'curve'`、`RenderMode: 'solid'`
- 颜色：`ColorBase: '#FFFFFFFF'`、`ColorCrest: '#FFFFFFFF'`、`ColorMiddle: '#FFFFFFFF'`
- 画布尺寸：`Width: 800`、`Height: 225`
- 频率处理：`FftSize: 4096`、`WindowFunc: 'hann'`、`CutoffLow: 30`、`CutoffHigh: 17500`
- 动态范围：`Floor: -65`、`Ceiling: 0`、`Slope: 0`
- 时域平滑：`TemporalSmoothing: 'exp_moving_avg'`、`Gravity: 0.65`
- 频谱分布：`logScale: true`、`mirrorFreqAxis: false`
- 条形图参数：`BarWidth: 24`、`BarGap: 6`、`RoundedCaps: false`
- 通道配置：`ChannelMode: 'mono'`、`Channel: 0`
- 版本控制：`SettingsVersion: 2`

**读取流程：**
1. 查询 `waveform_defaults WHERE id = 1`
2. 如果存在且 `SettingsVersion` 匹配当前版本 → 合并 stored + defaults 返回
3. 否则返回 `DEFAULT_SETTINGS` 的深拷贝

**保存流程：**
```sql
INSERT INTO waveform_defaults (id, settings) VALUES (1, ?)
ON DUPLICATE KEY UPDATE settings = ?
```

### 5.4 服务层 — services/

#### 5.4.1 authService.js — 认证服务

[authService.js](file:///d:/Projects/star_music_web/services/authService.js) 封装用户认证的全部业务逻辑。

**自定义异常类 `AppError`：**

```javascript
class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;     // 错误代码常量（如 'PASSWORD_MISMATCH'）
    this.status = status; // HTTP 状态码（如 400）
  }
}
```

路由层通过 `instanceof authService.AppError` 区分业务错误和系统错误，前者将错误信息通过 URL 参数传递展示友好提示，后者记录日志并返回 500。

**核心函数：**

| 函数 | 签名 | 处理流程 |
|------|------|---------|
| `register` | `({ username, password, repassword })` | 1. 校验两次密码一致；2. 检查用户名唯一性；3. bcrypt.hash(password, 10)；4. userRepository.createUser() |
| `login` | `({ username, password })` | 1. userRepository.findByUsername()；2. bcrypt.compare()；3. signToken(user) 生成 JWT，返回 Token |
| `updateProfile` | `(userId, nickname, signature)` | 1. 截断清理输入（nickname ≤50 字符，signature ≤200 字符）；2. userRepository.updateProfile()；3. userRepository.findById() 获取最新数据；4. signToken(freshUser) 重新签发 JWT |

**`signToken(user)` 内部函数：**

```javascript
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      nickname: user.nickname || null,
      signature: user.signature || null
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}
```

JWT Payload 包含用户 ID、用户名、角色、昵称和签名，过期时间由 `JWT_EXPIRES_IN` 环境变量控制（默认 `7d`）。

**导出的错误码对照表：**

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|------------|
| `PASSWORD_MISMATCH` | 两次密码不一致 | 400 |
| `USERNAME_EXISTS` | 用户名已存在 | 409 |
| `USER_NOT_FOUND` | 账号不存在 | 401 |
| `INVALID_PASSWORD` | 密码错误 | 401 |

#### 5.4.2 musicService.js — 音乐服务

[musicService.js](file:///d:/Projects/star_music_web/services/musicService.js) 封装音乐相关的全部业务逻辑。

**核心函数：**

| 函数 | 说明 |
|------|------|
| `getHomePageData(user)` | 聚合首页数据：全量音乐列表、用户收藏 ID 集合、精选曲目（第一首）、社区统计（总曲目数、去重艺术家数、总播放数、用户收藏数） |
| `getMyspaceData(user)` | 聚合个人空间数据：用户收藏列表（含音乐详情）、管理员的上传列表 |
| `uploadMusic(body, files, user)` | 上传音乐：从 req.body 提取 song_name/singer → 从 req.files 提取 cover/music 路径 → musicRepository.createMusic() |
| `collect(userId, musicId)` | 收藏音乐：toPositiveInt() 参数校验 → collectRepository.exists() 去重 → collectRepository.create() |
| `uncollect(userId, musicId)` | 取消收藏：toPositiveInt() 参数校验 → collectRepository.deleteOne() |
| `incrementPlayCount(musicId)` | 递增播放量：校验 → findById() 检查存在性 → musicRepository.incrementPlayCount() → 返回最新 play_count |
| `deleteMusic(musicId)` | 删除音乐：校验 → findById() 查记录 → deleteIfExists() 删封面文件 → deleteIfExists() 删音乐文件 → collectRepository.deleteByMusicId() 级联清理收藏 → musicRepository.deleteById() 删数据行 |

**辅助函数：**

| 函数 | 说明 |
|------|------|
| `resolvePublicFilePath(assetPath)` | 将数据库中的相对路径（如 `/uploads/covers/xxx.jpg`）解析为文件系统的绝对路径 |
| `deleteIfExists(filePath)` | 安全删除文件：`fs.existsSync()` 检查后才执行 `fs.unlinkSync()` |
| `toPositiveInt(value)` | 将字符串/数值安全转换为正整数，非法输入返回 `null`，用于所有 ID 参数的合法性校验 |

### 5.5 数据访问层 — repositories/

所有 Repository 文件均直接引用 `db.js` 导出的 Promise 连接池（`require('../db')`），使用 `await db.query(sql, params)` 语法，查询结果解构为 `const [rows] = await db.query(...)`。

#### 5.5.1 userRepository.js

[userRepository.js](file:///d:/Projects/star_music_web/repositories/userRepository.js) 封装 `users` 表的全部查询：

| 函数 | SQL 操作 | 返回值 |
|------|---------|--------|
| `findByUsername(username)` | `SELECT * FROM users WHERE username = ?` | row 对象或 null |
| `findById(id)` | `SELECT * FROM users WHERE id = ?` | row 对象或 null |
| `existsByUsername(username)` | `SELECT id FROM users WHERE username = ?` | boolean（rows.length > 0） |
| `createUser(username, password)` | `INSERT INTO users (username, password) VALUES (?, ?)` | 无（返回 query result） |
| `updateProfile(id, nickname, signature)` | `UPDATE users SET nickname = ?, signature = ? WHERE id = ?` | 无 |

注：`password` 字段存储的是 bcrypt 哈希值，不是明文。

#### 5.5.2 musicRepository.js

[musicRepository.js](file:///d:/Projects/star_music_web/repositories/musicRepository.js) 封装 `music` 表查询。

**公共查询片段 `MUSIC_SELECT`（所有查询共用）：**

```javascript
const MUSIC_SELECT = `
  SELECT
    m.*,
    COALESCE(u.nickname, u.username, '独立音乐人') AS uploader_name,
    COALESCE(u.role, 'user') AS uploader_role
  FROM music m
  LEFT JOIN users u ON u.id = m.uploader_id
`;
```

通过 LEFT JOIN 关联上传者信息，使用 `COALESCE` 三级回退显示上传者名称。

| 函数 | 说明 |
|------|------|
| `getAllMusic()` | 获取所有音乐，按创建时间倒序，LEFT JOIN 上传者信息 |
| `getAllMusicPaged(page, pageSize)` | 分页查询（`LIMIT ? OFFSET ?`）+ 总数统计（`SELECT COUNT(*)`） |
| `getUploadedByUser(userId)` | 按上传者 ID 筛选（WHERE m.uploader_id = ?） |
| `findById(musicId)` | 按 ID 查询单条记录，返回 row 或 null |
| `createMusic(songName, singer, coverPath, musicPath, uploaderId)` | INSERT 新记录 |
| `incrementPlayCount(musicId)` | `UPDATE music SET play_count = COALESCE(play_count, 0) + 1 WHERE id = ?`，然后回查最新值返回 |
| `deleteById(musicId)` | `DELETE FROM music WHERE id = ?` |

#### 5.5.3 collectRepository.js

[collectRepository.js](file:///d:/Projects/star_music_web/repositories/collectRepository.js) 封装 `collect` 表操作：

| 函数 | SQL 要点 | 说明 |
|------|---------|------|
| `getCollectedIdsByUser(userId)` | `SELECT music_id FROM collect WHERE user_id = ?` | 获取用户收藏的音乐 ID 列表 |
| `getCollectedMusicByUser(userId)` | `SELECT m.*, c.created_at AS collected_at, ... FROM music m INNER JOIN collect c ON m.id = c.music_id LEFT JOIN users u ... WHERE c.user_id = ? ORDER BY c.created_at DESC` | 获取用户收藏的音乐详情（三表 JOIN） |
| `exists(userId, musicId)` | `SELECT id FROM collect WHERE user_id = ? AND music_id = ?` | 检查是否已收藏，返回 boolean |
| `create(userId, musicId)` | `INSERT INTO collect (user_id, music_id) VALUES (?, ?)` | 插入收藏记录 |
| `deleteOne(userId, musicId)` | `DELETE FROM collect WHERE user_id = ? AND music_id = ?` | 删除单条收藏 |
| `deleteByMusicId(musicId)` | `DELETE FROM collect WHERE music_id = ?` | 删除某音乐的全部收藏记录（用于音乐删除时的级联清理） |

### 5.6 中间件 — middleware/

#### 5.6.1 auth.js — 认证中间件

[auth.js](file:///d:/Projects/star_music_web/middleware/auth.js) 提供三个中间件，基于 Cookie 中的 JWT Token 进行认证。

**`requireLogin` — 强制登录中间件：**

```
1. 从 req.cookies.token 提取 Token
2. Token 不存在 → 重定向到 /?auth=login
3. jwt.verify(token, JWT_SECRET) 验证
   - 失败 → res.clearCookie('token') + 重定向到 /?auth=login
   - 成功 → req.user = decoded，调用 next()
```

**`detectLogin` — 检测登录状态（可选认证）：**

```
1. 从 req.cookies.token 提取 Token
2. 存在则验证 → 成功则 req.user = decoded
3. 失败则清除 Cookie
4. 无论是否登录，始终调用 next()
```

用于欢迎页等既需要展示未登录内容、也希望识别已登录用户的场景。

**`requireAdmin` — 管理员校验中间件：**

```
1. 检查 req.user 是否存在且 req.user.role === 'admin'
2. 不满足 → res.send('权限不足！仅管理员可访问')
3. 满足 → next()
```

注意：`requireAdmin` 不自行验证 Token，它依赖 `requireLogin` 已将 `req.user` 挂载。因此路由中需组合使用：`requireLogin, requireAdmin`。

**导出的中间件：**

```javascript
module.exports = { requireLogin, detectLogin, requireAdmin };
```

#### 5.6.2 upload.js — 上传中间件

[upload.js](file:///d:/Projects/star_music_web/middleware/upload.js) 使用 `multer` 配置文件上传。

**存储策略（`diskStorage`）：**

| 文件字段 | 存储目录 | 文件名格式 |
|---------|---------|-----------|
| `cover` | `./public/uploads/covers` | `{timestamp}-{6位随机字符串}{ext}` |
| `music` | `./public/uploads/music` | `{timestamp}-{6位随机字符串}{ext}` |

**文件类型过滤（`fileFilter`）：**

| 字段 | 允许的 MIME 类型 | 错误信息 |
|------|-----------------|---------|
| `cover` | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | `封面仅支持 JPG/PNG/WebP/GIF 格式` |
| `music` | `audio/mpeg`, `audio/mp3` | `音频仅支持 MP3 格式` |

**文件大小限制：** `MAX_FILE_SIZE = 20 * 1024 * 1024`（20 MB）。超限时 multer 抛出 `LIMIT_FILE_SIZE` 错误，由 `app.js` 的全局错误处理中间件统一返回 413 响应。

### 5.7 视图层 — views/

#### 5.7.1 视图文件总览

| 文件 | 说明 | 对应路由 |
|------|------|---------|
| [welcome.ejs](file:///d:/Projects/star_music_web/views/welcome.ejs) | 欢迎页：3D 粒子 Canvas 背景、Hero 区域、内嵌登录/注册弹窗、画廊面板、统计数据面板 | `GET /` |
| [app.ejs](file:///d:/Projects/star_music_web/views/app.ejs) | SPA 主应用页：Home 面板、Visualizer 面板、MySpace 面板、Upload 面板（管理员专属） | `GET /app` |

#### 5.7.2 _partials 子模板

| 文件 | 说明 |
|------|------|
| `viz_js_new.ejs` | 音频频谱可视化 JavaScript 代码（被 `app.ejs` 的 Visualizer 面板引用，内嵌 `<script>` 标签） |
| `viz_panel_new.ejs` | 频谱可视化面板的 HTML 结构 + 参数滑块/颜色选择器等 UI 控件 |

### 5.8 前端静态资源 — public/

#### 5.8.1 CSS 样式体系

前端 CSS 采用**组件化 + 页面级分离**的策略，共 18 个文件：

| 文件 | 职责 |
|------|------|
| `base.css` | CSS 自定义属性（变量）、全局重置、排版基础、滚动条样式、通用工具类 |
| `components.css` | 跨页面复用组件：按钮（`.btn-*`）、卡片（`.card`）、表单、弹窗、通知 |
| `responsive.css` | 响应式断点，适配不同屏幕尺寸（移动端/平板/桌面） |
| `welcome.css` | 欢迎页：全屏布局、3D Canvas 容器、Hero 面板、分段面板动画 |
| `home.css` | 首页：Hero 统计、推荐歌单、通知区域 |
| `login.css` | 登录卡片样式（被 welcome.ejs 的 `?auth=login` 模式内嵌使用） |
| `register.css` | 注册卡片样式（被 welcome.ejs 的 `?auth=register` 模式内嵌使用） |
| `visualizer-panel.css` | 可视化面板：Canvas 容器、参数面板、滑块样式 |
| `myspace.css` | 个人空间：Profile 卡片、Tab 切换、收藏/上传网格 |
| `upload.css` | 上传界面：拖拽区域、进度条 |
| `admin-console.css` | 管理后台：数据表格、操作按钮、搜索筛选 |
| `card-nav.css` | 汉堡菜单卡片展开/收缩动画 |
| `blur-text.css` | 文本字符/单词入场模糊特效 |
| `gradual-blur.css` | 渐进式模糊效果 |
| `scroll-float.css` | 滚动漂浮入场动画 |
| `circular-gallery.css` | 无限循环画廊样式 |
| `logo-loop.css` | Logo 无限滚动样式 |
| `count-up.css` | 数字递增动画样式 |

#### 5.8.2 JavaScript 模块总览

| 文件 | 功能分类 | 说明 |
|------|---------|------|
| `app-switcher.js` | 核心框架 | SPA 面板切换系统，管理四个面板的横向滑动切换（CSS transform translateX） |
| `card-nav.js` | 导航组件 | 汉堡菜单展开/收缩的卡片导航 |
| `home.js` | 页面交互 | 首页每日推荐加载、交互事件绑定 |
| `myspace.js` | 页面交互 | 个人空间：Tab 切换、收藏按歌手筛选、播放历史管理 |
| `admin-console.js` | 页面交互 | 管理员后台：页面内容编辑与画廊管理 |
| `welcome.js` | 页面特效 | 欢迎页物理惯性滚动（滚轮/触摸 → 速度 + 摩擦力 + 吸附） |
| `welcome-3d.js` | 页面特效 | 欢迎页 Canvas 2D 3D 粒子背景（数百粒子 + 透视投影 + 鼠标交互） |
| `visualizer-waveform.js` | 核心功能 | Web Audio API 实时频谱可视化引擎（AudioContext → AnalyserNode → Canvas 绘制） |
| `visualizer-controls.js` | 核心功能 | 频谱参数控制面板的 DOM 绑定与实时更新 |
| `count-up.js` | UI 特效 | 数字滚动递增动画（IntersectionObserver + rAF 插值） |
| `blur-text.js` | UI 特效 | 文本逐字/逐词入场模糊动画（IntersectionObserver + CSS filter blur） |
| `gradual-blur.js` | UI 特效 | 基于滚动位置的渐进式模糊效果 |
| `scroll-float.js` | UI 特效 | 滚动触发的元素漂浮入场动画 |
| `circular-gallery.js` | UI 特效 | 无限循环卡片画廊（DOM 克隆 + lerp 平滑滚动 + 位置复位） |
| `logo-loop.js` | UI 特效 | Logo 无缝循环滚动（克隆内部 HTML） |
| `magic-rings.js` | UI 特效 | 光环装饰特效 |
| `physics-scroll.js` | 工具库 | 物理惯性滚动通用模块（可跨页面复用） |

---

## 6. 关键类与函数说明

### 6.1 路由处理函数

#### pageRoutes.js — `GET /app`

SPA 主应用的核心路由，负责一次性加载所有面板数据：

```
输入: req.user（由 requireLogin 挂载），req.query.page
处理:
  1. 校验 upload 面板的访问权限（仅 admin）
  2. Promise.all 并行查询：
     a. musicService.getHomePageData(user)   → 音乐列表 + 收藏 IDs + 社区统计
     b. musicService.getMyspaceData(user)    → 收藏列表 + 管理员上传列表
     c. userRepository.findById(user.id)     → 完整用户信息（nickname/signature）
  3. 从 page_content 表加载各面板的可编辑文字内容
  4. 合并 nickname/signature 到 user 对象
  5. 渲染 app.ejs
输出: { ...homeData, ...myspaceData, currentPage, user, pageContent }
```

#### authRoutes.js — `POST /api/login`

```javascript
router.post('/login', async (req, res) => {
  const token = await authService.login(req.body);   // 验证账户 → 生成 JWT
  res.cookie('token', token, {                        // 设置 HttpOnly Cookie
    httpOnly: true,      // 防止 XSS 读取
    sameSite: 'lax',     // 防止 CSRF
    maxAge: 24 * 60 * 60 * 1000  // 24 小时
  });
  res.redirect('/home');                              // POST-Redirect-GET 模式
});
```

错误处理：`authService.AppError` → 重定向到 `/?auth=login&error=xxx`；系统错误 → 500。

#### musicRoutes.js — `POST /api/upload`

```javascript
router.post('/upload', requireLogin, requireAdmin,
  upload.fields([{ name: 'cover' }, { name: 'music' }]),
  async (req, res) => {
    await musicService.uploadMusic(req.body, req.files, req.user);
    res.redirect('/app?page=home');
  }
);
```

multer 先处理 `cover` 和 `music` 两个文件字段，存入 `public/uploads/covers/` 和 `public/uploads/music/`。然后 `musicService.uploadMusic()` 提取 `song_name`、`singer` 和文件路径写入数据库。

#### adminRoutes.js — `POST /api/admin/gallery-image`

手动解析 `multipart/form-data` 原始数据流（不依赖 multer）：

```
1. req.on('data') / req.on('end') 读取完整请求体 Buffer
2. 从 Content-Type 头提取 boundary 字符串
3. 按 boundary 拆分各部分
4. 查找包含 filename= 的部分，提取文件二进制数据
5. 写入 public/uploads/gallery/ 目录
6. 返回 JSON { ok: true, url: '/uploads/gallery/xxx.png' }
```

### 6.2 服务层函数

#### authService.register({ username, password, repassword })

```
输入: { username, password, repassword }
处理:
  1. password !== repassword → throw AppError('两次密码不一致', 'PASSWORD_MISMATCH', 400)
  2. userRepository.existsByUsername(username) → throw AppError('账号已存在', 'USERNAME_EXISTS', 409)
  3. bcrypt.hash(password, 10) → 密码哈希
  4. userRepository.createUser(username, hashPwd) → 写入数据库
输出: 无（通过路由层重定向）
异常: AppError（业务错误）| Error（系统错误）
```

#### authService.login({ username, password })

```
输入: { username, password }
处理:
  1. userRepository.findByUsername(username) → 不存在则 throw AppError('账号不存在')
  2. bcrypt.compare(password, user.password) → 不匹配则 throw AppError('密码错误')
  3. signToken(user) → 生成包含 { id, username, role, nickname, signature } 的 JWT
输出: JWT Token 字符串
```

#### authService.signToken(user) — 内部函数

```javascript
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role,
      nickname: user.nickname || null, signature: user.signature || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}
```

#### musicService.getHomePageData(user)

```
输入: user（来自 JWT Payload）
处理:
  1. musicRepository.getAllMusic() → 全量音乐列表（LEFT JOIN 上传者信息）
  2. collectRepository.getCollectedIdsByUser(user.id) → 收藏 ID 集合
  3. 计算社区统计:
     - totalTracks: 音乐总数
     - totalArtists: 唯一歌手数量（去重）
     - totalPlays: 总播放量（累加）
     - collectedCount: 当前用户收藏数
  4. featuredTrack = musicList[0]（最新上传的曲目）
输出: { user, musicList, collectedIds, featuredTrack, communityStats }
```

#### musicService.uploadMusic(body, files, user)

```
输入: req.body, req.files（multer 处理后）, req.user
处理:
  1. 提取 song_name, singer → 非空校验
  2. 提取 cover 文件路径 → /uploads/covers/{filename}
  3. 提取 music 文件路径 → /uploads/music/{filename}
  4. 校验两个文件均存在
  5. musicRepository.createMusic(name, singer, coverPath, musicPath, userId)
输出: 无
```

#### musicService.collect(userId, musicId) / uncollect(userId, musicId)

```
输入: userId, musicId
处理:
  1. toPositiveInt() 将参数安全转为正整数（非法输入返回 null → 抛异常）
  2. collect(): 调用 exists() 去重 → 已存在则 throw → 否则 create()
  3. uncollect(): 直接 deleteOne()
输出: 无
```

#### musicService.deleteMusic(musicId)

```
输入: musicId
处理:
  1. toPositiveInt(musicId) → 参数校验
  2. musicRepository.findById(id) → 存在性检查
  3. fs.unlinkSync() → 删除封面文件（public/uploads/covers/）
  4. fs.unlinkSync() → 删除音乐文件（public/uploads/music/）
  5. collectRepository.deleteByMusicId(id) → 清理关联收藏
  6. musicRepository.deleteById(id) → 删除数据行
输出: 无
```

### 6.3 数据访问层函数

#### userRepository 函数

| 函数 | SQL 查询 | 返回 |
|------|---------|------|
| `findByUsername(username)` | `SELECT * FROM users WHERE username = ?` | row 或 null |
| `findById(id)` | `SELECT * FROM users WHERE id = ?` | row 或 null |
| `existsByUsername(username)` | `SELECT id FROM users WHERE username = ?` | boolean |
| `createUser(username, password)` | `INSERT INTO users (username, password) VALUES (?, ?)` | — |
| `updateProfile(id, nickname, signature)` | `UPDATE users SET nickname = ?, signature = ? WHERE id = ?` | — |

#### musicRepository 函数

| 函数 | 核心 SQL | 说明 |
|------|---------|------|
| `getAllMusic()` | `SELECT m.*, COALESCE(u.nickname, u.username, '独立音乐人') AS uploader_name ... FROM music m LEFT JOIN users u` | 全量查询，按 `created_at DESC` 排序 |
| `getAllMusicPaged(page, pageSize)` | 同上 + `LIMIT ? OFFSET ?` + `SELECT COUNT(*) AS total FROM music` | 分页 + 总数统计 |
| `getUploadedByUser(userId)` | 同上 + `WHERE m.uploader_id = ?` | 管理员查看自己的上传 |
| `findById(musicId)` | 同上 + `WHERE m.id = ?` | 单条查询 |
| `createMusic(name, singer, cover, music, uid)` | `INSERT INTO music (song_name, singer, cover_path, mp3_path, uploader_id) VALUES (?,?,?,?,?)` | — |
| `incrementPlayCount(musicId)` | `UPDATE music SET play_count = COALESCE(play_count, 0) + 1 WHERE id = ?` | 返回递增后的值 |
| `deleteById(musicId)` | `DELETE FROM music WHERE id = ?` | — |

#### collectRepository 函数

| 函数 | 核心 SQL | 说明 |
|------|---------|------|
| `getCollectedIdsByUser(userId)` | `SELECT music_id FROM collect WHERE user_id = ?` | 仅返回 ID 列表 |
| `getCollectedMusicByUser(userId)` | `SELECT m.*, c.created_at AS collected_at ... FROM music m INNER JOIN collect c ... WHERE c.user_id = ?` | JOIN 音乐详情 + 上传者 |
| `exists(userId, musicId)` | `SELECT id FROM collect WHERE user_id = ? AND music_id = ?` | 去重检查 |
| `create(userId, musicId)` | `INSERT INTO collect (user_id, music_id) VALUES (?, ?)` | — |
| `deleteOne(userId, musicId)` | `DELETE FROM collect WHERE user_id = ? AND music_id = ?` | — |
| `deleteByMusicId(musicId)` | `DELETE FROM collect WHERE music_id = ?` | 级联清理 |

### 6.4 中间件函数

#### requireLogin

```javascript
function requireLogin(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/?auth=login');              // 未登录 → 回到欢迎页
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // 验证并注入用户
    next();
  } catch (err) {
    res.clearCookie('token');                          // Token 失效 → 清除
    res.redirect('/?auth=login');
  }
}
```

**关键细节：** 认证基于 `req.cookies.token`（由 `cookie-parser` 解析），不需要 `Authorization` Header。验证失败时清除 Cookie 避免死循环。

#### detectLogin

非阻塞认证检测，无论是否登录均放行：

```javascript
function detectLogin(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { res.clearCookie('token'); }
  }
  next();  // 始终放行
}
```

用于欢迎页等公开页面，可选展示用户信息。

#### requireAdmin

```javascript
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  res.send('权限不足！仅管理员可访问');
}
```

依赖 `requireLogin` 先行注入 `req.user`，因此始终以 `requireLogin, requireAdmin` 组合使用。

### 6.5 前端核心模块

#### app-switcher.js — SPA 面板切换引擎

四个面板 (home / visualizer / myspace / upload) 横向排列，通过 CSS `transform: translateX()` 实现滑动切换：

```javascript
// 核心状态
var pageOrder = ['home', 'visualizer', 'myspace', 'upload'];
var currentPage, currentPageIndex;
var moveStartX, moveCurrentX, targetTranslate;

// 核心方法
function switchToPage(page, pushState) {
  var newIdx = pageOrder.indexOf(page);
  targetTranslate = -newIdx * 100;     // 计算目标百分比
  moveTrackTo(newIdx);                 // 更新 CSS transform
  currentPage = page;
  updateArrows();                      // 更新左右导航箭头可见性
  disableArrowIfNeeded();              // 首尾面板隐藏对应箭头
}
```

页面初始化时从 URL 的 `?page=` 参数恢复当前面板。切换时支持推入浏览器 History。

#### visualizer-waveform.js — 音频频谱可视化引擎

使用 Web Audio API 实现实时频谱可视化，核心数据流：

```
HTMLAudioElement (音乐播放器)
    │
    ▼
AudioContext.createMediaElementSource()
    │
    ├──▶ AnalyserNode (频域)  ──▶ getByteFrequencyData()   ──┐
    │                                                          │
    └──▶ AnalyserNode (时域)  ──▶ getByteTimeDomainData()  ──┤
                                                               │
    ┌──────────────────────────────────────────────────────────┘
    ▼
requestAnimationFrame 循环
    │
    ▼
Canvas 2D 绑定绘制 (curve / bars / step 等模式)
```

可配置参数超过 60 项（见 `waveformRoutes.js` 中的 `DEFAULT_SETTINGS`），包括 FFT 大小、窗口函数、平滑参数、渲染模式、通道模式、颜色渐变、对数/线性频率轴等。

#### visualizer-controls.js — 频谱参数控制面板

将 60+ 参数中的可调部分暴露为 UI 控件（滑块、颜色选择器、下拉框、开关），每个控件绑定对应的可视化参数，通过事件监听实时更新渲染效果。

#### welcome.js — 物理惯性滚动 (欢迎页)

基于牛顿力学模型的惯性滚动系统：

```
物理参数:
  baseFriction     = 2.7    // 基础摩擦力
  centerGravity    = 2.0    // 中心吸附力
  wheelImpulse     = 0.60   // 滚轮冲量系数
  edgeDampingWidth = 0.18   // 边缘阻尼宽度
  snapEase         = 0.16   // 吸附缓动系数
  idleBeforeSnap   = 150    // 空闲后自动吸附延迟 (ms)
```

每帧 `requestAnimationFrame` 更新速度与位置：滚轮/触摸事件累加速度 → 摩擦力持续衰减 → 中心引力吸附到最近面板 → 边缘阻尼防止越界。滚动停止 150ms 后自动吸附到最近面板。

#### home.js — 首页交互

- 加载精选曲目（featuredTrack）并渲染 Hero 区域
- 社区统计数据绑定（通过 `count-up.js` 动画展示）
- 通知区域（显示收藏成功/上传成功等消息）
- 音乐播放控制事件绑定

#### myspace.js — 个人空间

- **Tab 切换：** 收藏列表 / 上传列表（管理员可见）的 Tab 导航
- **收藏管理：** 按歌手名称筛选收藏、取消收藏操作
- **播放历史管理：** 展示播放过的曲目
- **卡片删除动画：** CSS transition 配合 DOM 移除

#### admin-console.js — 管理员后台

- **页面内容编辑：** 读取/编辑 `page_content` 表的数据，支持多面板（welcome/home/myspace/visualizer/upload）
- **画廊管理：** 管理 `gallery_items` 表的艺术家和赞助商展示数据，支持拖拽排序、图片上传、实时预览

#### count-up.js — 数字递增动画

基于 `IntersectionObserver`，元素进入视口时触发：

```javascript
function triggerAnim(el) {
  var from  = parseInt(el.dataset.countFrom || '0');
  var to    = parseInt(el.dataset.countTo   || '100');
  var dur   = parseFloat(el.dataset.countDuration || '2');
  // requestAnimationFrame 逐帧插值，支持逗号分隔的数字格式化
}
```

#### circular-gallery.js — 无限循环画廊

实现原理：原始卡片 → 克隆两份 → 三倍长度数组 → 线性插值 (lerp) 平滑滚动 → 偏移超一圈后复位，实现无缝无限循环。

---

## 7. 数据库设计

### 核心表结构

#### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | 用户 ID |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | 用户名 |
| `password` | VARCHAR(255) | NOT NULL | bcrypt 密码哈希 |
| `role` | ENUM('user', 'admin') | DEFAULT 'user' | 角色 |
| `nickname` | VARCHAR(50) | DEFAULT NULL | 昵称（由迁移添加） |
| `signature` | VARCHAR(200) | DEFAULT NULL | 个性签名（由迁移添加） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### music 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | 音乐 ID |
| `song_name` | VARCHAR(200) | NOT NULL | 歌曲标题 |
| `singer` | VARCHAR(200) | NOT NULL | 歌手 |
| `cover_path` | VARCHAR(500) | NOT NULL | 封面图片路径（相对 public/） |
| `mp3_path` | VARCHAR(500) | NOT NULL | 音频文件路径（相对 public/） |
| `uploader_id` | INT | FOREIGN KEY → users(id) | 上传者 |
| `play_count` | INT | DEFAULT 0 | 播放次数 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 上传时间 |

#### collect 表（收藏）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | 记录 ID |
| `user_id` | INT | FOREIGN KEY → users(id) | 用户 |
| `music_id` | INT | FOREIGN KEY → music(id) | 音乐 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 收藏时间 |

#### waveform_defaults 表（可视化默认设置）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, CHECK(id = 1) | 固定为 1（单行表） |
| `settings` | JSON | NOT NULL | 60+ 参数的 JSON 对象 |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### page_content 表（页面可编辑内容）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | 记录 ID |
| `page_name` | VARCHAR(50) | NOT NULL | 页面标识（welcome/home/myspace 等） |
| `content_key` | VARCHAR(80) | NOT NULL | 内容键名 |
| `content_value` | TEXT | — | 内容值 |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| — | — | UNIQUE(`page_name`, `content_key`) | 联合唯一约束 |

#### gallery_items 表（画廊展示数据）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | 记录 ID |
| `page_name` | VARCHAR(50) | DEFAULT 'welcome' | 所属页面 |
| `item_type` | VARCHAR(20) | NOT NULL | 类型（artist / sponsor） |
| `sort_order` | INT | DEFAULT 0 | 排序序号 |
| `item_name` | VARCHAR(100) | DEFAULT '' | 展示名称 |
| `image_url` | VARCHAR(500) | DEFAULT '' | 图片 URL / CSS gradient |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| — | — | UNIQUE(`page_name`, `item_type`, `sort_order`) | 联合唯一约束 |

### 数据库关系图

```
users (1) ──────< music (N)         [uploader_id → users.id]
  │
  │ (1)
  ├──────────────< collect (N)      [user_id → users.id]
  │                   │
  │                   │ (N)
  │                   ▼
  │              music (1)           [music_id → music.id]
  │
  ▼
page_content (独立表，无外键)
waveform_defaults (独立表，单行)
gallery_items (独立表，无外键)
```

---

## 8. 依赖关系

### 8.1 运行时依赖 (package.json)

| 包名 | 版本 | 用途 |
|------|------|------|
| `express` | ^4.21.2 | Web 框架 |
| `ejs` | ^3.1.10 | 模板引擎 |
| `mysql2` | ^3.12.0 | MySQL 驱动（Promise 封装） |
| `cookie-parser` | ^1.4.7 | Cookie 解析中间件 |
| `jsonwebtoken` | ^9.0.2 | JWT 生成与验证 |
| `bcryptjs` | ^2.4.3 | 密码哈希 |
| `multer` | ^1.4.5-lts.1 | 文件上传处理（multipart/form-data） |
| `dotenv` | ^16.4.7 | 环境变量加载（.env 文件） |

### 8.2 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `nodemon` | ^3.1.9 | 开发热重载 |

### 8.3 模块间依赖图

```
app.js
  ├── db.js ──────────────────────▶ mysql2 (连接池)
  │
  ├── routes/
  │   ├── pageRoutes.js ──────────▶ middleware/auth.js (detectLogin, requireLogin, requireAdmin)
  │   │                              services/musicService.js
  │   │                              repositories/userRepository.js
  │   │                              db.js（page_content / gallery_items 直查）
  │   │
  │   ├── authRoutes.js ──────────▶ middleware/auth.js
  │   │                              services/authService.js
  │   │
  │   ├── musicRoutes.js ─────────▶ middleware/auth.js, middleware/upload.js
  │   │                              services/musicService.js
  │   │
  │   ├── adminRoutes.js ─────────▶ middleware/auth.js
  │   │                              db.js（直查 page_content / gallery_items）
  │   │
  │   └── waveformRoutes.js ──────▶ middleware/auth.js
  │                                  db.js（直查 waveform_defaults）
  │
  ├── services/
  │   ├── authService.js ─────────▶ repositories/userRepository.js
  │   │                              bcryptjs, jsonwebtoken
  │   │
  │   └── musicService.js ────────▶ repositories/musicRepository.js
  │                                  repositories/collectRepository.js
  │                                  fs, path (文件操作)
  │
  └── repositories/
      ├── userRepository.js ──────▶ db.js (db.promise())
      ├── musicRepository.js ─────▶ db.js (db.promise())
      └── collectRepository.js ───▶ db.js (db.promise())
```

**依赖特点：**
- 路由层部分直连 `db.js`（如 `pageRoutes`、`adminRoutes` 查询 `page_content`/`gallery_items`，`waveformRoutes` 查询 `waveform_defaults`），这些表没有对应的 Service/Repository 抽象
- `music` 和 `collect` 表有完整的 Repository + Service 分层
- `users` 表有 Repository 但没有独立路由，在 `authRoutes` 中通过 `authService` → `userRepository` 间接访问
- 前端脚本之间通过全局变量通信（如 `app-switcher.js` 暴露 `switchToPage` 给其他模块使用）
- CSS 文件通过 `<link>` 标签在 EJS 模板中按需引入

---

## 9. 项目运行方式

### 9.1 本地开发环境搭建

#### 前置要求

| 软件 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | ≥ 18.x | JavaScript 运行时 |
| MySQL | ≥ 8.0 | 关系型数据库 |

Windows 11 推荐使用 [MySQL Installer](https://dev.mysql.com/downloads/installer/) 安装 MySQL。

#### 步骤

**1. 安装依赖**

```powershell
cd d:\Projects\star_music_web
npm install
```

**2. 配置环境变量**

```powershell
copy .env.example .env
```

编辑 `.env` 填写实际配置：

```env
# 服务器端口
PORT=3000

# MySQL 连接信息
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=star_music
DB_PORT=3306

# JWT 认证密钥
JWT_SECRET=your_random_secret_string_here
JWT_EXPIRES_IN=7d
```

**3. 创建 MySQL 数据库**

```sql
CREATE DATABASE star_music CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**4. 创建数据表**

项目需要预先创建以下基础表（迁移表由 `db.js` 的 `runMigrations()` 自动创建）：

```sql
-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 音乐表
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

-- 收藏表
CREATE TABLE collect (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  music_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (music_id) REFERENCES music(id)
);
```

> `waveform_defaults`、`page_content`、`gallery_items` 三张表以及 `users.nickname` / `users.signature` 字段由 `db.js` 的 `runMigrations()` 在应用启动时自动创建，无需手动建表。

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

等价于 `nodemon app.js`，文件变更时自动重启。服务默认监听 `http://localhost:3000`。

**7. 访问应用**

| 页面 | URL |
|------|-----|
| 欢迎页（含登录/注册） | `http://localhost:3000/` |
| SPA 主应用 | `http://localhost:3000/app` |
| 首页面板 | `http://localhost:3000/home` |
| 个人空间 | `http://localhost:3000/myspace` |
| 可视化面板 | `http://localhost:3000/visualizer` |
| 上传面板（仅管理员） | `http://localhost:3000/upload` |

### 9.2 角色说明

项目有 **两种用户角色**：

| 角色 | `users.role` | 权限 |
|------|-------------|------|
| 普通用户 | `user` | 浏览音乐、播放、收藏/取消收藏、可视化 |
| 管理员 | `admin` | 以上全部 + 上传音乐、删除音乐、编辑页面内容、管理画廊、修改可视化默认设置 |

创建管理员账户需要直接在数据库中修改：

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

### 9.3 NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 生产模式启动 (`node app.js`) |
| `npm run dev` | 开发模式启动 (`nodemon app.js`，文件变更自动重启) |

### 9.4 Session / Token 生命周期

- JWT Token 有效期由 `JWT_EXPIRES_IN` 环境变量控制（默认 `7d`）
- Token 存储在名为 `token` 的 HttpOnly Cookie 中
- Cookie 配置：`httpOnly: true`, `sameSite: 'lax'`, `maxAge: 24h`
- 登录成功后写入 Cookie，登出时清除
- Token 验证在 `middleware/auth.js` 的 `requireLogin` / `detectLogin` 中执行

---

## 10. 前端特效系统

本项目前端包含一套完整的视觉特效系统，所有特效基于原生 Web API 实现，**无第三方动画库依赖**。

| 特效模块 | 技术原理 | 应用页面 |
|---------|---------|---------|
| **3D 粒子背景** (`welcome-3d.js`) | Canvas 2D 模拟粒子系统：数百个随机位置/速度/大小的粒子，通过透视投影模拟 3D 景深效果。鼠标移动影响粒子运动方向与速度 | 欢迎页 |
| **物理惯性滚动** (`physics-scroll.js`, `welcome.js`) | 基于牛顿力学模型：速度 + 摩擦力衰减 + 中心吸附力 + 边缘阻尼 + 空闲自动吸附。逐帧 `requestAnimationFrame` 更新 | 欢迎页 |
| **面板滑动切换** (`app-switcher.js`) | CSS `transform: translateX()` 横向滑动，`requestAnimationFrame` 动画队列协调。支持 Browser History pushState | 主应用页 |
| **文本入场模糊** (`blur-text.js`) | `IntersectionObserver` + CSS `filter: blur()` + `clip-path` 逐字揭示。支持字符级/单词级动画 | 登录/注册卡片 |
| **数字递增** (`count-up.js`) | `IntersectionObserver` + `requestAnimationFrame` 线性插值 + 逗号分隔数字格式化 | 欢迎页统计 |
| **无限循环画廊** (`circular-gallery.js`) | DOM 节点克隆三份 + 线性插值 (lerp) 平滑滚动 + 位置复位实现无缝循环 | 欢迎页 |
| **渐进式模糊** (`gradual-blur.js`) | 基于滚动位置动态计算 `backdrop-filter: blur()` 值 | 多页面通用 |
| **Logo 循环** (`logo-loop.js`) | 克隆内部 HTML 实现无缝水平循环滚动 | 欢迎页 |
| **卡片导航** (`card-nav.js`) | 高度动态计算 + CSS `transition` 伸缩动画 | 移动端汉堡菜单 |
| **光环特效** (`magic-rings.js`) | Canvas / CSS 动画实现装饰性光环效果 | 视觉装饰 |
| **滚动漂浮** (`scroll-float.js`) | 滚动触发的 `translateY` 漂浮入场动画，支持滚动反转 | 多页面通用 |

---

> **文档维护说明：** 本文档基于 2026-05-14 代码库状态生成。项目代码持续迭代中，如发现文档与代码不一致，请以实际代码为准。