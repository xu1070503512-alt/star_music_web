(function () {
  var ctx = window.__STAR_MUSIC_HOME__ || {};
  if (ctx.userRole !== 'admin') return;

  var overlay, body, saveBtn, statusEl;
  var isDragging = false, dragStartX, dragStartY, winStartX, winStartY;
  var currentPage = ctx.currentPage || 'home';
  var savedData = {};
  var galleryData = { artist: [], sponsor: [] };

  // Each item: { key, label, selector }
  var pageSchemas = {
    welcome: {
      sections: {
        '★ Hero 文字': [
          { key: 'heroEyebrow', label: '英文小字' },
          { key: 'heroTitle', label: '主标题' },
          { key: 'heroSubtitle', label: '副标题' }
        ],
        '★ Hero 按钮 & 标签': [
          { key: 'heroBtnLogin', label: '登录按钮文字' },
          { key: 'heroBtnRegister', label: '注册按钮文字' },
          { key: 'heroTag1', label: '标签1' },
          { key: 'heroTag2', label: '标签2' },
          { key: 'heroTag3', label: '标签3' },
          { key: 'heroTag4', label: '标签4' }
        ],
        '★ 统计区文案': [
          { key: 'statsLead', label: '统计引导文' },
          { key: 'statsDescriptor', label: '统计描述' },
          { key: 'statsSub', label: '统计副文' }
        ],
        '★ Count Up 动效参数': [
          { key: 'countUpTo', label: '终值 To', type: 'num' },
          { key: 'countUpFrom', label: '起始值 From', type: 'num' },
          { key: 'countUpDuration', label: '持续时间(s) Duration', type: 'num' },
          { key: 'countUpDelay', label: '延迟(s) Delay', type: 'num' },
          { key: 'countUpDirection', label: '方向 Direction', type: 'select', options: ['up','down'], labels: ['向上递增 up','向下递减 down'] },
          { key: 'countUpSeparator', label: '分隔符 Separator' }
        ],
        '★ 知名音乐人标题': [
          { key: 'featuredHeader', label: '音乐人标题' },
          { key: 'featuredSub', label: '音乐人副标题' }
        ],
        '★ 赞助商标题': [
          { key: 'sponsorHeader', label: '赞助商标题' },
          { key: 'sponsorSub', label: '赞助商副标题' }
        ]
      }
    },
    home: {
      sections: {
        '★ Hero 文字': [
          { key: 'homeEyebrow', label: '英文小字' },
          { key: 'homeTitle', label: '主标题' },
          { key: 'homeSummary', label: '副标题' }
        ],
        '★ 筛选按钮': [
          { key: 'filterAll', label: '"全部" 按钮' },
          { key: 'filterCollected', label: '"已收藏" 按钮' },
          { key: 'filterUncollected', label: '"未收藏" 按钮' },
          { key: 'filterPopular', label: '"最热门" 按钮' }
        ]
      }
    },
    myspace: {
      sections: {
        '★ Profile 文案': [
          { key: 'myspaceEyebrow', label: '英文小字' }
        ]
      }
    },
    visualizer: { sections: {} },
    upload: { sections: {} }
  };

  function getSchema(page) {
    return pageSchemas[page] || { sections: {} };
  }

  function readLive(key) {
    var el = document.querySelector('[data-edit-key="' + key + '"]');
    if (!el) return savedData[key] || '';

    // Count-up keys: read from data attributes on the .stats-number element
    var attrMap = {
      countUpTo: 'data-count-to', countUpFrom: 'data-count-from',
      countUpDuration: 'data-count-duration', countUpDelay: 'data-count-delay',
      countUpDirection: 'data-count-direction', countUpSeparator: 'data-count-separator'
    };
    if (attrMap[key]) {
      var ce = document.querySelector('[data-count-up]');
      if (ce) {
        var v = ce.getAttribute(attrMap[key]);
        if (v != null) return v;
      }
      return savedData[key] || '';
    }

    return el.textContent.trim();
  }

  function previewToDom(key, value) {
    var el = document.querySelector('[data-edit-key="' + key + '"]');
    if (!el) return;

    // Count-up keys: update data-* attribute on .stats-number, then re-trigger anim
    var attrMap = {
      countUpTo: 'data-count-to', countUpFrom: 'data-count-from',
      countUpDuration: 'data-count-duration', countUpDelay: 'data-count-delay',
      countUpDirection: 'data-count-direction', countUpSeparator: 'data-count-separator'
    };
    if (attrMap[key]) {
      var ce = document.querySelector('[data-count-up]');
      if (ce) {
        ce.setAttribute(attrMap[key], value);
        if (window.__countUpEngine) window.__countUpEngine.rerun(ce);
      }
      return;
    }

    el.textContent = value;
  }

  // ── Build DOM ──
  overlay = document.createElement('div');
  overlay.id = 'adminConsoleOverlay';
  overlay.innerHTML = '<div class="admin-console-window">' +
    '<div class="admin-console-header"><span class="console-icon">⚙</span><span class="console-title">控制台</span><button class="console-close">✕</button></div>' +
    '<div class="admin-console-body"></div>' +
    '<div class="console-save-bar"><button class="console-save-btn">保存更改</button><span class="console-status"></span></div>' +
    '</div>';
  document.body.appendChild(overlay);

  body = overlay.querySelector('.admin-console-body');
  saveBtn = overlay.querySelector('.console-save-btn');
  statusEl = overlay.querySelector('.console-status');

  // ── Drag ──
  var header = overlay.querySelector('.admin-console-header');
  header.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.console-close')) return;
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    winStartX = overlay.offsetLeft; winStartY = overlay.offsetTop;
    overlay.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointermove', function (e) {
    if (!isDragging) return;
    overlay.style.left = (winStartX + e.clientX - dragStartX) + 'px';
    overlay.style.top = (winStartY + e.clientY - dragStartY) + 'px';
    overlay.style.right = 'auto';
  });
  window.addEventListener('pointerup', function () { isDragging = false; });

  overlay.querySelector('.console-close').addEventListener('click', function () {
    overlay.style.display = 'none';
  });

  // ── Gallery helpers ──
  function makeImgUpload(onDone) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var file = inp.files[0];
      if (!file) { inp.remove(); return; }
      var fd = new FormData();
      fd.append('image', file);
      fetch('/api/admin/gallery-image', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok && onDone) onDone(d.url);
        })
        .catch(function () {})
        .finally(function () { inp.remove(); });
    });
    inp.click();
  }

  function buildGalleryHTML(itemType, items, labelFn) {
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var isImg = /\.(jpg|jpeg|png|webp|gif|svg)/i.test(it.image) || it.image.indexOf('/uploads/') >= 0 || it.image.indexOf('picsum.photos') >= 0;
      var previewHtml = isImg
        ? '<img src="' + esc(it.image) + '" style="width:60px;height:60px;object-fit:cover;border-radius:4px;margin-right:6px;vertical-align:middle;">'
        : '<div style="width:60px;height:60px;border-radius:4px;margin-right:6px;display:inline-block;vertical-align:middle;background:' + esc(it.image) + ';"></div>';
      html += '<div class="gallery-item-row" data-idx="' + i + '" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:4px;background:rgba(255,255,255,0.03);border-radius:6px">';
      html += '<span style="min-width:18px;color:rgba(255,255,255,0.3);font-size:0.7rem;text-align:center">#' + (i + 1) + '</span>';
      html += previewHtml;
      html += '<div style="flex:1"><input class="gallery-name-inp" data-idx="' + i + '" value="' + esc(it.name) + '" style="width:100%;margin-bottom:2px;padding:2px 4px;font-size:0.7rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:3px;color:#e0e0e0"><button class="gallery-upload-btn" data-idx="' + i + '" style="font-size:0.65rem;padding:1px 6px;background:rgba(124,92,255,0.2);border:1px solid rgba(124,92,255,0.3);border-radius:3px;color:#c8c0ff;cursor:pointer">换图</button></div>';
      html += '<button class="gallery-del-btn" data-idx="' + i + '" style="background:none;border:none;color:#ff5c5c;cursor:pointer;font-size:1rem;padding:0 4px">✕</button>';
      html += '</div>';
    }
    html += '<button class="gallery-add-btn" style="margin-top:4px;padding:4px 10px;font-size:0.7rem;background:rgba(124,92,255,0.15);border:1px dashed rgba(124,92,255,0.3);border-radius:4px;color:#c8c0ff;cursor:pointer;width:100%">+ 新增' + labelFn + '</button>';
    return html;
  }

  // ── Save ──
  saveBtn.addEventListener('click', async function () {
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    var changes = {};
    body.querySelectorAll('.console-field input, .console-field textarea').forEach(function (el) {
      changes[el.name] = el.value;
      savedData[el.name] = el.value;
      previewToDom(el.name, el.value);
    });
    var artists = [], sponsors = [];
    body.querySelectorAll('.gallery-item-row').forEach(function (row) {
      var idx = parseInt(row.dataset.idx, 10);
      var nameEl = row.querySelector('.gallery-name-inp');
      var name = nameEl ? nameEl.value.trim() : '';
      if (row.closest('#consoleArtists')) {
        artists[idx] = { name: name, image: galleryData.artist[idx] ? galleryData.artist[idx].image : '' };
      } else if (row.closest('#consoleSponsors')) {
        sponsors[idx] = { name: name, image: galleryData.sponsor[idx] ? galleryData.sponsor[idx].image : '' };
      }
    });
    artists = artists.filter(function (a) { return a; });
    sponsors = sponsors.filter(function (a) { return a; });

    try {
      var r1 = await fetch('/api/admin/page-content', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: currentPage, changes: changes })
      });
      var r2 = await fetch('/api/admin/gallery', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'welcome', item_type: 'artist', items: artists })
      });
      var r3 = await fetch('/api/admin/gallery', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'welcome', item_type: 'sponsor', items: sponsors })
      });
      var d1 = await r1.json(), d2 = await r2.json(), d3 = await r3.json();
      statusEl.textContent = (d1.ok && d2.ok && d3.ok) ? '✓ 已保存' : '✗ 失败';
    } catch (e) { statusEl.textContent = '✗ 网络错误'; }
    setTimeout(function () { statusEl.textContent = ''; saveBtn.disabled = false; saveBtn.textContent = '保存更改'; }, 2000);
    loadData(currentPage);
  });

  // ── Rebuild fields for current page ──
  function rebuild(page) {
    currentPage = page;
    var schema = getSchema(page);
    var sections = schema.sections;
    var html = '';
    var hasAny = false;

    for (var secName in sections) {
      if (!sections.hasOwnProperty(secName)) continue;
      var fields = sections[secName];
      if (!fields.length) continue;
      hasAny = true;
      html += '<div class="section-label">' + secName + '</div>';
      fields.forEach(function (f) {
        var liveVal = readLive(f.key);
        html += '<div class="console-field"><label>' + f.label + '</label>';
        if (f.type === 'select' && f.options) {
          html += '<select class="field-input viz-select" name="' + f.key + '" style="width:100%">';
          for (var oi = 0; oi < f.options.length; oi++) {
            var sel = (liveVal === f.options[oi]) ? ' selected' : '';
            var lbl = f.labels ? f.labels[oi] : f.options[oi];
            html += '<option value="' + f.options[oi] + '"' + sel + '>' + lbl + '</option>';
          }
          html += '</select>';
        } else if (f.type === 'num') {
          html += '<input name="' + f.key + '" type="number" value="' + esc(liveVal) + '" style="width:100%">';
        } else if (f.key.indexOf('Sub') >= 0 || f.key.indexOf('sub') >= 0 || f.key.indexOf('Title') >= 0 || f.key.indexOf('title') >= 0 || f.key.indexOf('Summary') >= 0) {
          html += '<textarea name="' + f.key + '" rows="2">' + esc(liveVal) + '</textarea>';
        } else {
          html += '<input name="' + f.key + '" value="' + esc(liveVal) + '">';
        }
        html += '</div>';
      });
    }

    // ── Gallery sections (welcome page only) ──
    if (page === 'welcome') {
      html += '<div class="section-label">★ 知名音乐人画廊</div>';
      html += '<div id="consoleArtists" style="margin-bottom:8px">';
      html += buildGalleryHTML('artist', galleryData.artist, '音乐人');
      html += '</div>';

      html += '<div class="section-label">★ 赞助商画廊</div>';
      html += '<div id="consoleSponsors" style="margin-bottom:8px">';
      html += buildGalleryHTML('sponsor', galleryData.sponsor, '赞助商');
      html += '</div>';
      hasAny = true;
    }

    if (!hasAny) {
      html = '<div style="color:rgba(255,255,255,0.3);font-size:0.78rem;text-align:center;padding:20px 0">当前页面无文本参数</div>';
    }
    body.innerHTML = html;

    // ── Bind events ──
    body.querySelectorAll('.console-field input, .console-field textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        previewToDom(el.name, el.value);
      });
    });
    body.querySelectorAll('.console-field select').forEach(function (el) {
      el.addEventListener('change', function () {
        previewToDom(el.name, el.value);
      });
    });

    // Gallery name change
    body.querySelectorAll('.gallery-name-inp').forEach(function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(el.dataset.idx, 10);
        var isArtist = !!el.closest('#consoleArtists');
        var arr = isArtist ? galleryData.artist : galleryData.sponsor;
        if (arr[idx]) arr[idx].name = el.value;
        // live preview to DOM
        var baseKey = isArtist ? 'artist_name_' : 'sponsor_name_';
        previewToDom(baseKey + idx, el.value);
      });
    });

    // Upload buttons
    body.querySelectorAll('.gallery-upload-btn').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(el.dataset.idx, 10);
        var isArtist = !!el.closest('#consoleArtists');
        var arr = isArtist ? galleryData.artist : galleryData.sponsor;
        makeImgUpload(function (url) {
          if (arr[idx]) { arr[idx].image = url; }
          rebuild(page);
        });
      });
    });

    // Delete buttons
    body.querySelectorAll('.gallery-del-btn').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(el.dataset.idx, 10);
        var isArtist = !!el.closest('#consoleArtists');
        var arr = isArtist ? galleryData.artist : galleryData.sponsor;
        arr.splice(idx, 1);
        rebuild(page);
      });
    });

    // Add buttons
    body.querySelectorAll('.gallery-add-btn').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var isArtist = !!el.closest('#consoleArtists');
        var arr = isArtist ? galleryData.artist : galleryData.sponsor;
        if (isArtist) {
          arr.push({ name: '新音乐人', image: 'https://picsum.photos/seed/new' + Date.now() + '/400/520?grayscale' });
        } else {
          arr.push({ name: '新品牌', image: 'linear-gradient(135deg, #7c5cff, #19d3ff)' });
        }
        rebuild(page);
      });
    });
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ── Load saved from server then rebuild ──
  async function loadData(page) {
    try {
      var r = await fetch('/api/admin/page-content?page=' + page);
      var d = await r.json();
      if (d.ok) savedData = d.data || {};
    } catch (e) { savedData = {}; }
    if (page === 'welcome') {
      try {
        var gr = await fetch('/api/admin/gallery?page=welcome');
        var gd = await gr.json();
        if (gd.ok) galleryData = gd.data || { artist: [], sponsor: [] };
      } catch (e) { galleryData = { artist: [], sponsor: [] }; }
    }
    rebuild(page);
  }

  // ── Public API ──
  window.__adminConsole = {
    toggle: function () {
      if (overlay.style.display === 'none') { overlay.style.display = ''; loadData(currentPage); }
      else { overlay.style.display = overlay.style.display === '' ? 'none' : ''; }
    },
    switchTo: function (page) {
      if (overlay.style.display === 'none') return;
      loadData(page);
    },
    show: function () { overlay.style.display = ''; loadData(currentPage); },
    hide: function () { overlay.style.display = 'none'; },
    refresh: function () { loadData(currentPage); }
  };

  window.addEventListener('pageswitch', function (e) {
    currentPage = e.detail.page;
    if (overlay.style.display !== 'none') loadData(currentPage);
  });

  loadData(currentPage);
})();
