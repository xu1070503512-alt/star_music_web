document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'star-music-history';
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const contents = Array.from(document.querySelectorAll('.tab-content'));
  const historyGrid = document.getElementById('historyGrid');
  const historyEmptyState = document.getElementById('historyEmptyState');
  const collectSingerFilters = document.getElementById('collectSingerFilters');
  const collectGrid = document.getElementById('collectGrid');
  const collectEmptyState = document.getElementById('collectEmptyState');
  const uploadGrid = document.getElementById('uploadGrid');
  const uploadEmptyState = document.getElementById('uploadEmptyState');

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
        <p>${item.artist}</p>
        <span>${new Date(item.playedAt).toLocaleString('zh-CN')}</span>
        <div class="music-card-actions">
          <button class="btn btn-primary btn-compact history-play-btn" type="button" data-src="${item.src}" data-name="${item.name}" data-artist="${item.artist}">再次播放</button>
        </div>
      </article>
    `).join('');

    historyGrid.querySelectorAll('.history-play-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.__playTrack) {
          window.__playTrack(btn.dataset.src, '', btn.dataset.name, btn.dataset.artist);
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

  // ── Profile Edit ──────────────────────────
  const toggleEditBtn = document.getElementById('toggleEditBtn');
  const profileEditPanel = document.getElementById('profileEditPanel');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editNickname = document.getElementById('editNickname');
  const editSignature = document.getElementById('editSignature');
  const displayNickname = document.getElementById('displayNickname');
  const displaySignature = document.getElementById('displaySignature');

  if (toggleEditBtn && profileEditPanel) {
    toggleEditBtn.addEventListener('click', function () {
      var isOpen = profileEditPanel.style.display !== 'none';
      if (isOpen) {
        profileEditPanel.style.display = 'none';
        toggleEditBtn.classList.remove('active');
      } else {
        profileEditPanel.style.display = '';
        toggleEditBtn.classList.add('active');
        profileEditPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (cancelEditBtn && profileEditPanel && toggleEditBtn) {
    cancelEditBtn.addEventListener('click', function () {
      profileEditPanel.style.display = 'none';
      toggleEditBtn.classList.remove('active');
      if (editNickname) editNickname.value = displayNickname ? displayNickname.textContent : '';
      if (editSignature) {
        var sig = (displaySignature && displaySignature.textContent) || '';
        if (sig === '还没有个性签名，点击编辑来写一句话吧。') sig = '';
        editSignature.value = sig;
      }
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async function () {
      var nickname = editNickname ? editNickname.value.trim() : '';
      var signature = editSignature ? editSignature.value.trim() : '';

      saveProfileBtn.disabled = true;
      saveProfileBtn.textContent = '保存中...';

      try {
        var resp = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: nickname, signature: signature })
        });
        var data = await resp.json();
        if (data.ok) {
          window.location.reload();
        } else {
          alert(data.message || '保存失败');
        }
      } catch (err) {
        alert('网络错误，请重试');
      } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = '保存';
      }
    });
  }

  buildCollectFilters();
  renderHistory();
  updateEmptyState(collectGrid, collectEmptyState, '.collect-card');
  updateEmptyState(uploadGrid, uploadEmptyState, '.upload-card-item');
});
