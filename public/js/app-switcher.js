(function () {
  var panels = document.querySelectorAll('.app-panel');
  if (!panels.length) return;

  var currentPage = (window.__STAR_MUSIC_HOME__ && window.__STAR_MUSIC_HOME__.currentPage) || 'home';
  var visualizerCanvas = document.getElementById('visualizerCanvas');
  var homePanel = document.getElementById('panel-home');
  var myspacePanel = document.getElementById('panel-myspace');
  var uploadPanel = document.getElementById('panel-upload');
  var playerShell = document.querySelector('.player-shell');

  var pageToPanel = { home: homePanel, myspace: myspacePanel, upload: uploadPanel };
  var pageOrder = ['home', 'myspace', 'upload'];

  function hideAllPanels() {
    panels.forEach(function (p) { p.style.display = 'none'; });
  }

  function showPanel(panel) {
    if (!panel) return;
    panel.style.display = 'block';
  }

  function switchToPage(page, pushState) {
    if (page === currentPage) return;
    currentPage = page;
    hideAllPanels();
    var panel = pageToPanel[page];
    showPanel(panel);

    if (visualizerCanvas) {
      visualizerCanvas.style.display = (page === 'home') ? '' : 'none';
    }

    if (playerShell) {
      playerShell.style.display = (page === 'upload') ? 'none' : '';
    }

    updateArrows();

    if (pushState !== false) {
      var url = '/app?page=' + page;
      if (window.location.search.indexOf('page=' + page) === -1) {
        history.pushState({ page: page }, '', url);
      }
    }
  }

  // ── Left / Right Arrow Buttons ──────────────────
  function buildArrow(dir) {
    var btn = document.createElement('button');
    btn.className = 'app-nav-arrow app-nav-' + dir;
    btn.setAttribute('aria-label', dir === 'left' ? 'Previous page' : 'Next page');
    btn.innerHTML = dir === 'left' ? '&#8249;' : '&#8250;';
    btn.addEventListener('click', function () {
      var idx = pageOrder.indexOf(currentPage);
      if (dir === 'left') {
        idx = (idx - 1 + pageOrder.length) % pageOrder.length;
      } else {
        idx = (idx + 1) % pageOrder.length;
      }
      switchToPage(pageOrder[idx], true);
    });
    return btn;
  }

  var leftArrow = buildArrow('left');
  var rightArrow = buildArrow('right');
  document.body.appendChild(leftArrow);
  document.body.appendChild(rightArrow);

  function updateArrows() {
    leftArrow.classList.toggle('disabled', false);
    rightArrow.classList.toggle('disabled', false);
  }

  // ── Init ────────────────────────────────────────
  hideAllPanels();
  showPanel(pageToPanel[currentPage] || homePanel);
  if (visualizerCanvas && currentPage !== 'home') {
    visualizerCanvas.style.display = 'none';
  }
  updateArrows();

  // ── Link interception ──────────────────────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    var href = link.getAttribute('href');
    if (!href) return;
    var page = 'home';
    var match = href.match(/page=([^&]+)/);
    if (match) page = match[1];
    switchToPage(page, true);
  });

  window.addEventListener('popstate', function (e) {
    var page = 'home';
    if (e.state && e.state.page) {
      page = e.state.page;
    } else {
      var m = window.location.search.match(/page=([^&]+)/);
      if (m) page = m[1];
    }
    switchToPage(page, false);
  });

  window.__appSwitch = switchToPage;
})();
