(function () {
  var panels = document.querySelectorAll('.app-panel');
  if (!panels.length) return;

  var ctx = window.__STAR_MUSIC_HOME__ || {};
  var isAdmin = ctx.userRole === 'admin';
  var currentPage = ctx.currentPage || 'home';
  var homePanel = document.getElementById('panel-home');
  var vizPanel = document.getElementById('panel-visualizer');
  var myspacePanel = document.getElementById('panel-myspace');
  var uploadPanel = document.getElementById('panel-upload');
  var track = document.querySelector('.panel-track');

  var pageToPanel = { home: homePanel, visualizer: vizPanel, myspace: myspacePanel };
  var pageOrder = ['home', 'visualizer', 'myspace'];
  if (isAdmin && uploadPanel) {
    pageToPanel.upload = uploadPanel;
    pageOrder.push('upload');
  }

  function pageIndex(page) {
    return pageOrder.indexOf(page);
  }

  function moveTrackTo(index) {
    if (!track) return;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
  }

  function switchToPage(page, pushState) {
    if (page === currentPage) return;
    var newIdx = pageIndex(page);
    if (newIdx < 0) return;

    var oldPanel = pageToPanel[currentPage];

    // Remove content-in from old panel so it can replay next visit
    if (oldPanel) {
      oldPanel.classList.remove('panel-content-in');
      oldPanel.querySelectorAll('main > *').forEach(function (el) {
        el.style.animation = 'none';
      });
    }

    moveTrackTo(newIdx);
    currentPage = page;
    if (window.__STAR_MUSIC_HOME__) window.__STAR_MUSIC_HOME__.currentPage = page;
    updateArrows();

    if (window.__physicsScroll) {
      if (page === 'visualizer') {
        window.__physicsScroll.reset();
      } else if (oldPanel && oldPanel.id === 'panel-visualizer') {
        window.__physicsScroll.reset();
      }
    }
    if (page === 'visualizer' && window.__waveformEngine) {
      setTimeout(function () { window.__waveformEngine.resize(); }, 150);
    }

    if (pushState !== false) {
      var url = '/app?page=' + page;
      history.pushState({ page: page }, '', url);
    }

    window.dispatchEvent(new CustomEvent('pageswitch', { detail: { page: page } }));

    // Content stagger on the new panel
    var newPanel = pageToPanel[page];
    if (newPanel && !newPanel.classList.contains('panel-content-in')) {
      setTimeout(function () {
        newPanel.classList.add('panel-content-in');
      }, 100);
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

  // ── Init ──
  moveTrackTo(pageIndex(currentPage));
  updateArrows();

  var initPanel = pageToPanel[currentPage];
  if (initPanel) {
    requestAnimationFrame(function () {
      initPanel.classList.add('panel-content-in');
    });
    setTimeout(function () {
      if (window.__physicsScroll) window.__physicsScroll.reset();
    }, 150);
  }

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
