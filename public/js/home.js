document.addEventListener('DOMContentLoaded', () => {
  const storageKeys = {
    volume: 'star-music-volume',
    mode: 'star-music-mode',
    visualizer: 'star-music-visualizer',
    history: 'star-music-history'
  };

  const audio = document.getElementById('audioPlayer');
  const canvas = document.getElementById('visualizerCanvas');
  const playerCover = document.getElementById('playerCover');
  const playerName = document.getElementById('playerName');
  const playerArtist = document.getElementById('playerArtist');
  const playBtn = document.getElementById('playBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const modeBtn = document.getElementById('modeBtn');
  const modeLabel = document.getElementById('modeLabel');
  const volumeBtn = document.getElementById('volumeBtn');
  const elasticSlider = document.getElementById('elasticVolumeSlider');
  const elasticFill = document.getElementById('elasticVolumeFill');
  const progress = document.getElementById('progress');
  const bar = document.getElementById('bar');
  const timeDisplay = document.getElementById('time');
  const playlistBtn = document.getElementById('playlistBtn');
  const playlistPanel = document.getElementById('playlistPanel');
  const resultCountText = document.getElementById('resultCountText');
  const searchInput = document.getElementById('musicSearchInput');
  const filterChipGroup = document.getElementById('filterChipGroup');
  const musicGrid = document.getElementById('musicGrid');
  const musicEmptyState = document.getElementById('musicEmptyState');
  const toggleVisualizerBtn = document.getElementById('toggleVisualizerBtn');
  const volumeContainer = document.querySelector('.volume-container');
  const playButtons = Array.from(document.querySelectorAll('.play-btn'));
  const playFabButtons = Array.from(document.querySelectorAll('.play-fab'));
  const collectButtons = Array.from(document.querySelectorAll('.collect-btn'));
  const allPlayTriggers = [...playButtons, ...playFabButtons];
  const modeImg = modeBtn ? modeBtn.querySelector('img') : null;
  const volumeImg = volumeBtn ? volumeBtn.querySelector('img') : null;
  const playImg = playBtn ? playBtn.querySelector('img') : null;
  const cards = Array.from(document.querySelectorAll('#musicGrid .music-card, #panel-home .music-card'));
  const pageState = window.__STAR_MUSIC_HOME__ || {};

  if (!audio || !cards.length || !canvas || !musicGrid) {
    return;
  }

  const modes = ['sequence', 'loop', 'random'];
  const modeLabels = {
    sequence: '顺序',
    loop: '循环',
    random: '随机'
  };

  let currentIndex = -1;
  let visibleCards = [...cards];
  let isPlaying = false;
  let draggingProgress = false;
  let audioContext;
  let analyser;
  let sourceNode;
  let animationFrameId;
  let visualizerEnabled = localStorage.getItem(storageKeys.visualizer) !== 'off';
  let playMode = localStorage.getItem(storageKeys.mode) || pageState.initialMode || 'sequence';
  let lastTrackedMusicId = null;

  const playlist = cards.map((card, index) => ({
    index,
    id: card.dataset.musicId,
    cover: card.dataset.cover,
    name: card.dataset.name,
    artist: card.dataset.singer,
    uploader: card.dataset.uploader,
    src: card.dataset.src,
    playCount: Number(card.dataset.playCount || 0),
    card
  }));

  function updateModeUI() {
    if (modeLabel) {
      modeLabel.textContent = modeLabels[playMode] || '顺序';
    }
    if (modeImg) {
      modeImg.src = playMode === 'loop' ? '/images/Single_Loop.svg' : '/images/Loop.svg';
    }
    audio.loop = playMode === 'loop';
    localStorage.setItem(storageKeys.mode, playMode);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
      return '00:00';
    }
    const minute = String(Math.floor(seconds / 60)).padStart(2, '0');
    const second = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${minute}:${second}`;
  }

  function updatePlayState(nextState) {
    isPlaying = nextState;
    if (playImg) {
      playImg.src = nextState ? '/images/Pause.svg' : '/images/Play.svg';
    }
    if (playerCover) {
      playerCover.classList.toggle('rotating', nextState);
    }
  }

  function syncVolumeUI() {
    if (!volumeImg) return;
    volumeImg.src = audio.volume === 0 ? '/images/Volume_Mute.svg' : '/images/Volume.svg';
    if (elasticFill) {
      elasticFill.style.width = (audio.volume * 100).toFixed(1) + '%';
    }
    if (elasticSlider) {
      elasticSlider.setAttribute('aria-valuenow', Math.round(audio.volume * 100));
    }
  }

  function setVisualizerState(enabled) {
    visualizerEnabled = enabled;
    document.body.classList.toggle('is-visualizer-off', !enabled);
    localStorage.setItem(storageKeys.visualizer, enabled ? 'on' : 'off');
    if (toggleVisualizerBtn) {
      toggleVisualizerBtn.textContent = enabled ? '关闭可视化' : '开启可视化';
    }
  }

  function createAudioGraph() {
    if (audioContext || !window.AudioContext) {
      return;
    }

    audioContext = new window.AudioContext();
    sourceNode = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawVisualizer() {
    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    if (!visualizerEnabled) {
      animationFrameId = requestAnimationFrame(drawVisualizer);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(87, 75, 255, 0.18)');
    gradient.addColorStop(0.5, 'rgba(25, 211, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 95, 162, 0.16)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!analyser || audio.paused) {
      animationFrameId = requestAnimationFrame(drawVisualizer);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const baseY = height * 0.78;
    const barWidth = Math.max(8, width / dataArray.length / 1.6);
    const gap = barWidth * 0.5;
    let x = (width - (dataArray.length * barWidth + (dataArray.length - 1) * gap)) / 2;

    dataArray.forEach((value, index) => {
      const normalized = value / 255;
      const barHeight = Math.max(10, normalized * height * 0.18);
      const hue = 200 + index * 2.4;
      ctx.fillStyle = `hsla(${hue}, 90%, 68%, 0.78)`;
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      x += barWidth + gap;
    });

    const average = dataArray.reduce((sum, item) => sum + item, 0) / dataArray.length;
    const radius = 110 + average * 0.18;
    const centerX = width * 0.78;
    const centerY = height * 0.26;
    const orb = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    orb.addColorStop(0, 'rgba(124, 92, 255, 0.36)');
    orb.addColorStop(0.45, 'rgba(25, 211, 255, 0.12)');
    orb.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    animationFrameId = requestAnimationFrame(drawVisualizer);
  }

  function renderPlaylist() {
    const tracks = visibleCards.length
      ? playlist.filter((item) => visibleCards.includes(item.card))
      : playlist;

    playlistPanel.innerHTML = tracks.map((track) => `
      <div class="playlist-item ${track.index === currentIndex ? 'active' : ''}" data-index="${track.index}">
        <img src="${track.cover}" alt="${track.name}">
        <div>
          <div class="playlist-item-name">${track.name}</div>
          <div class="playlist-item-artist">${track.artist} · ${track.uploader}</div>
        </div>
      </div>
    `).join('');

    playlistPanel.querySelectorAll('.playlist-item').forEach((item) => {
      item.addEventListener('click', () => {
        loadSong(Number(item.dataset.index));
      });
    });
  }

  function writeHistory(track) {
    const raw = localStorage.getItem(storageKeys.history);
    const history = raw ? JSON.parse(raw) : [];
    const nextHistory = [
      {
        id: track.id,
        name: track.name,
        artist: track.artist,
        uploader: track.uploader,
        cover: track.cover,
        src: track.src,
        playedAt: Date.now()
      },
      ...history.filter((item) => String(item.id) !== String(track.id))
    ].slice(0, 12);

    localStorage.setItem(storageKeys.history, JSON.stringify(nextHistory));
  }

  async function trackPlayCount(track) {
    if (!track || lastTrackedMusicId === track.id) {
      return;
    }

    lastTrackedMusicId = track.id;

    try {
      const response = await fetch('/api/track_play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ music_id: track.id })
      });
      const result = await response.json();
      if (result.status === 'success' && typeof result.playCount === 'number') {
        track.playCount = result.playCount;
        track.card.dataset.playCount = String(result.playCount);
        const playCountNode = track.card.querySelector('.play-count-text');
        if (playCountNode) {
          playCountNode.textContent = String(result.playCount);
        }
      }
    } catch (err) {
      console.error('播放量更新失败：', err);
    }
  }

  async function ensureAudioContext() {
    createAudioGraph();
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }

  async function loadSong(index) {
    const track = playlist[index];
    if (!track) {
      return;
    }

    currentIndex = index;
    lastTrackedMusicId = null;
    audio.src = track.src;
    playerCover.src = track.cover;
    playerName.textContent = track.name;
    playerArtist.textContent = `${track.artist} · ${track.uploader}`;
    writeHistory(track);
    renderPlaylist();

    try {
      await ensureAudioContext();
      await audio.play();
      await trackPlayCount(track);
      updatePlayState(true);
    } catch (err) {
      console.error('播放失败：', err);
      updatePlayState(false);
    }
  }

  function updateProgressByClientX(clientX) {
    if (!audio.duration) {
      return;
    }
    const rect = progress.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
  }

  function getVisibleIndexes() {
    return visibleCards.map((card) => Number(playlist.find((item) => item.card === card)?.index)).filter(Number.isFinite);
  }

  function getNextIndex(direction) {
    const indexes = getVisibleIndexes();
    const fallback = playlist.map((item) => item.index);
    const usable = indexes.length ? indexes : fallback;

    if (!usable.length) {
      return -1;
    }

    if (playMode === 'random') {
      const randomIndex = Math.floor(Math.random() * usable.length);
      return usable[randomIndex];
    }

    if (currentIndex === -1) {
      return usable[0];
    }

    const currentVisibleIndex = usable.indexOf(currentIndex);
    if (currentVisibleIndex === -1) {
      return usable[0];
    }

    const nextVisibleIndex = (currentVisibleIndex + direction + usable.length) % usable.length;
    return usable[nextVisibleIndex];
  }

  function applyFilters() {
    const keyword = (searchInput.value || '').trim().toLowerCase();
    const activeChip = filterChipGroup.querySelector('.filter-chip.active');
    const filter = activeChip ? activeChip.dataset.filter : 'all';

    const workingCards = [...cards].sort((cardA, cardB) => {
      if (filter !== 'popular') {
        return 0;
      }
      return Number(cardB.dataset.playCount || 0) - Number(cardA.dataset.playCount || 0);
    });

    musicGrid.innerHTML = '';
    visibleCards = [];

    workingCards.forEach((card) => {
      const matchesKeyword = [card.dataset.name, card.dataset.singer, card.dataset.uploader]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
      const isCollected = card.dataset.collected === 'true';
      const matchesFilter =
        filter === 'all' ||
        filter === 'popular' ||
        (filter === 'collected' && isCollected) ||
        (filter === 'uncollected' && !isCollected);

      if (matchesKeyword && matchesFilter) {
        visibleCards.push(card);
        musicGrid.appendChild(card);
      }
    });

    resultCountText.textContent = `共 ${visibleCards.length} 首曲目`;
    musicEmptyState.classList.toggle('hidden', visibleCards.length !== 0);
    renderPlaylist();
  }

  allPlayTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = playlist.findIndex((item) => String(item.id) === String(btn.dataset.id));
      if (index >= 0) {
        loadSong(index);
      }
    });
  });

  collectButtons.forEach((btn) => {
    btn.addEventListener('click', async function handleCollect() {
      if (this.disabled) {
        return;
      }

      const response = await fetch('/api/star_collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ music_id: this.dataset.id })
      });
      const result = await response.json();
      if (result.status === 'success') {
        this.disabled = true;
        this.classList.add('is-collected');
        this.textContent = '已收藏';
        const card = this.closest('.music-card');
        if (card) {
          card.dataset.collected = 'true';
        }
        applyFilters();
      } else {
        alert(result.msg);
      }
    });
  });

  playBtn.addEventListener('click', async () => {
    if (currentIndex === -1) {
      const initialIndex = getNextIndex(1);
      if (initialIndex >= 0) {
        await loadSong(initialIndex);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      updatePlayState(false);
      return;
    }

    try {
      await ensureAudioContext();
      await audio.play();
      updatePlayState(true);
    } catch (err) {
      console.error('播放失败：', err);
      updatePlayState(false);
    }
  });

  prevBtn.addEventListener('click', () => {
    const index = getNextIndex(-1);
    if (index >= 0) {
      loadSong(index);
    }
  });

  nextBtn.addEventListener('click', () => {
    const index = getNextIndex(1);
    if (index >= 0) {
      loadSong(index);
    }
  });

  modeBtn.addEventListener('click', () => {
    const nextIndex = (modes.indexOf(playMode) + 1) % modes.length;
    playMode = modes[nextIndex];
    updateModeUI();
  });

  volumeBtn.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 768px)').matches && volumeContainer) {
      volumeContainer.classList.toggle('is-open');
    }

    if (audio.volume > 0) {
      audio.volume = 0;
    } else {
      const remembered = Number(localStorage.getItem(storageKeys.volume) || 0.85);
      audio.volume = remembered > 0 ? remembered : 0.85;
    }

    syncVolumeUI();
    localStorage.setItem(storageKeys.volume, String(audio.volume));
  });

  // ── Elastic Volume Slider ──────────────────────────
  (function initElasticSlider() {
    if (!elasticSlider || !elasticFill) return;

    var trackWrapper = elasticSlider.querySelector('.elastic-slider-track-wrapper');
    var leftIconBtn = document.getElementById('volumeBtn');
    var MAX_OVERFLOW = 50;
    var dragging = false;
    var overflow = 0;
    var clientX = 0;
    var region = 'middle'; // 'left' | 'middle' | 'right'

    function clampVolume(v) {
      return Math.max(0, Math.min(1, v));
    }

    function decay(value, max) {
      if (max === 0) return 0;
      var entry = value / max;
      var sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
      return sigmoid * max;
    }

    function getRangePct() {
      return audio.volume * 100;
    }

    function setVolumeFromClientX(x) {
      clientX = x;
      var rect = elasticSlider.getBoundingClientRect();
      var left = rect.left;
      var width = rect.width;
      var right = rect.right;
      var newOverflow;

      if (x < left) {
        region = 'left';
        newOverflow = left - x;
      } else if (x > right) {
        region = 'right';
        newOverflow = x - right;
      } else {
        region = 'middle';
        newOverflow = 0;
        audio.volume = clampVolume(1 - (right - x) / width);
        syncVolumeUI();
        elasticFill.style.width = getRangePct() + '%';
      }

      overflow = decay(newOverflow, MAX_OVERFLOW);
      updateTrackTransform();
    }

    function updateTrackTransform() {
      if (!trackWrapper || !elasticSlider) return;
      var sliderWidth = elasticSlider.getBoundingClientRect().width;

      var scaleX = 1 + overflow / Math.max(sliderWidth, 1);
      var scaleY = 1 - (overflow / MAX_OVERFLOW) * 0.2;
      var originX;

      if (clientX < elasticSlider.getBoundingClientRect().left + elasticSlider.getBoundingClientRect().width / 2) {
        originX = 'right';
      } else {
        originX = 'left';
      }

      trackWrapper.style.transform = 'scaleX(' + scaleX.toFixed(4) + ') scaleY(' + scaleY.toFixed(4) + ')';
      trackWrapper.style.transformOrigin = originX + ' center';

      if (leftIconBtn) {
        if (region === 'left') {
          leftIconBtn.style.transform = 'translateX(' + (-overflow) + 'px) scale(1.2)';
        } else {
          leftIconBtn.style.transform = 'translateX(0) scale(1)';
        }
      }
    }

    function snapBack() {
      overflow = 0;
      region = 'middle';
      trackWrapper.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      trackWrapper.style.transform = 'scaleX(1) scaleY(1)';
      if (leftIconBtn) {
        leftIconBtn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        leftIconBtn.style.transform = 'translateX(0) scale(1)';
      }
      setTimeout(function () {
        trackWrapper.style.transition = '';
        if (leftIconBtn) leftIconBtn.style.transition = '';
      }, 400);
    }

    elasticSlider.addEventListener('pointerdown', function (e) {
      dragging = true;
      elasticSlider.setPointerCapture(e.pointerId);
      trackWrapper.style.transition = '';
      if (leftIconBtn) leftIconBtn.style.transition = '';
      setVolumeFromClientX(e.clientX);
      localStorage.setItem(storageKeys.volume, String(audio.volume));
    });

    elasticSlider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setVolumeFromClientX(e.clientX);
      localStorage.setItem(storageKeys.volume, String(audio.volume));
    });

    elasticSlider.addEventListener('pointerup', snapBack);
    elasticSlider.addEventListener('pointercancel', snapBack);
    elasticSlider.addEventListener('lostpointercapture', snapBack);

    elasticSlider.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.1 : 0.05;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        audio.volume = clampVolume(audio.volume + step);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        audio.volume = clampVolume(audio.volume - step);
      }
      elasticFill.style.width = getRangePct() + '%';
      syncVolumeUI();
      localStorage.setItem(storageKeys.volume, String(audio.volume));
    });
  })();

  progress.addEventListener('pointerdown', (event) => {
    draggingProgress = true;
    updateProgressByClientX(event.clientX);
  });

  document.addEventListener('pointermove', (event) => {
    if (draggingProgress) {
      updateProgressByClientX(event.clientX);
    }
  });

  document.addEventListener('pointerup', () => {
    draggingProgress = false;
  });

  playlistBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    renderPlaylist();
    playlistPanel.classList.toggle('show');
  });

  playlistPanel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('click', (event) => {
    if (!playlistPanel.contains(event.target) && event.target !== playlistBtn) {
      playlistPanel.classList.remove('show');
    }
    if (volumeContainer && !volumeContainer.contains(event.target)) {
      volumeContainer.classList.remove('is-open');
    }
  });

  searchInput.addEventListener('input', applyFilters);
  filterChipGroup.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChipGroup.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      applyFilters();
    });
  });

  toggleVisualizerBtn.addEventListener('click', () => {
    setVisualizerState(!visualizerEnabled);
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || draggingProgress) {
      return;
    }
    const percent = (audio.currentTime / audio.duration) * 100;
    bar.style.width = `${percent}%`;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener('ended', () => {
    const index = getNextIndex(1);
    if (index >= 0) {
      loadSong(index);
    }
  });

  audio.addEventListener('play', () => updatePlayState(true));
  audio.addEventListener('pause', () => updatePlayState(false));

  window.addEventListener('resize', resizeCanvas);

  const initialVolume = Number(localStorage.getItem(storageKeys.volume) || 0.85);
  audio.volume = Math.max(0, Math.min(1, initialVolume));
  syncVolumeUI();
  updateModeUI();
  setVisualizerState(visualizerEnabled);
  resizeCanvas();
  drawVisualizer();
  applyFilters();

  window.__playTrack = function (src, cover, name, artist, uploader) {
    if (!src) return;
    var idx = playlist.findIndex(function (t) { return t.src === src && t.name === name; });
    if (idx >= 0) {
      loadSong(idx);
      return;
    }
    audio.src = src;
    if (playerCover) playerCover.src = cover;
    if (playerName) playerName.textContent = name;
    if (playerArtist) playerArtist.textContent = (artist || '') + (uploader ? ' · ' + uploader : '');
    currentIndex = -1;
    lastTrackedMusicId = null;
    renderPlaylist();
    ensureAudioContext().then(function () {
      return audio.play();
    }).then(function () {
      updatePlayState(true);
    }).catch(function (err) {
      console.error('Play failed:', err);
      updatePlayState(false);
    });
  };
});
