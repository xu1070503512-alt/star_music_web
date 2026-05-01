document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'star-music-history';
  const audio = document.getElementById('audioPlayer');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const contents = Array.from(document.querySelectorAll('.tab-content'));
  const historyGrid = document.getElementById('historyGrid');
  const historyEmptyState = document.getElementById('historyEmptyState');
  const collectSingerFilters = document.getElementById('collectSingerFilters');
  const collectGrid = document.getElementById('collectGrid');
  const collectEmptyState = document.getElementById('collectEmptyState');
  const uploadGrid = document.getElementById('uploadGrid');
  const uploadEmptyState = document.getElementById('uploadEmptyState');

  function playSource(source, name, artist) {
    if (!audio || !source) {
      return;
    }
    audio.src = source;
    if (name && artist) {
      audio.setAttribute('title', `${name} - ${artist}`);
    }
    audio.play().catch((err) => {
      console.error('播放失败：', err);
    });
  }

  function updateEmptyState(grid, emptyState, selector) {
    if (!grid || !emptyState) {
      return;
    }
    const count = grid.querySelectorAll(selector).length;
    emptyState.classList.toggle('hidden', count > 0);
  }

  function removeCardWithAnimation(card, callback) {
    if (!card) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    card.classList.add('fade-out');
    window.setTimeout(() => {
      card.remove();
      if (typeof callback === 'function') {
        callback();
      }
    }, 240);
  }

  function buildCollectFilters() {
    if (!collectSingerFilters || !collectGrid) {
      return;
    }

    const cards = Array.from(collectGrid.querySelectorAll('.collect-card'));
    const singers = [...new Set(cards.map((card) => card.dataset.singer).filter(Boolean))];
    const chips = ['全部', ...singers];

    collectSingerFilters.innerHTML = chips.map((label, index) => `
      <button type="button" class="${index === 0 ? 'active' : ''}" data-filter-value="${label}">${label}</button>
    `).join('');

    collectSingerFilters.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        collectSingerFilters.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
        const filterValue = btn.dataset.filterValue;
        cards.forEach((card) => {
          const matches = filterValue === '全部' || card.dataset.singer === filterValue;
          card.classList.toggle('hidden', !matches);
        });
      });
    });
  }

  function renderHistory() {
    if (!historyGrid || !historyEmptyState) {
      return;
    }

    const raw = localStorage.getItem(storageKey);
    const history = raw ? JSON.parse(raw) : [];

    if (!history.length) {
      historyGrid.innerHTML = '';
      historyEmptyState.classList.remove('hidden');
      return;
    }

    historyEmptyState.classList.add('hidden');
    historyGrid.innerHTML = history.map((item) => `
      <article class="history-card">
        <h3>${item.name}</h3>
        <p>${item.artist} · ${item.uploader || '社区上传'}</p>
        <span>${new Date(item.playedAt).toLocaleString('zh-CN')}</span>
        <div class="music-card-actions">
          <button class="btn btn-primary btn-compact history-play-btn" type="button" data-src="${item.src}" data-name="${item.name}" data-artist="${item.artist}">再次播放</button>
        </div>
      </article>
    `).join('');

    historyGrid.querySelectorAll('.history-play-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.__playTrack) {
          window.__playTrack(btn.dataset.src, '', btn.dataset.name, btn.dataset.artist, '');
        }
      });
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('active'));
      contents.forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`${tab.dataset.tab}Content`);
      if (target) {
        target.classList.add('active');
      }
    });
  });

  document.querySelectorAll('.play-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.__playTrack) {
        window.__playTrack(btn.dataset.src, '', btn.dataset.name, btn.dataset.artist, '');
      }
    });
  });

  document.querySelectorAll('.uncollect-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const response = await fetch('/api/uncollect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ music_id: btn.dataset.id })
      });
      const result = await response.json();
      if (result.status !== 'success') {
        alert(result.msg);
        return;
      }
      removeCardWithAnimation(btn.closest('.collect-card'), () => {
        updateEmptyState(collectGrid, collectEmptyState, '.collect-card');
        buildCollectFilters();
      });
    });
  });

  document.querySelectorAll('.delete-music-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const response = await fetch('/api/delete_music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ music_id: btn.dataset.id })
      });
      const result = await response.json();
      if (result.status !== 'success') {
        alert(result.msg);
        return;
      }
      removeCardWithAnimation(btn.closest('.upload-card-item'), () => {
        updateEmptyState(uploadGrid, uploadEmptyState, '.upload-card-item');
      });
    });
  });

  buildCollectFilters();
  renderHistory();
  updateEmptyState(collectGrid, collectEmptyState, '.collect-card');
  updateEmptyState(uploadGrid, uploadEmptyState, '.upload-card-item');
});
