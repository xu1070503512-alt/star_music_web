(function () {
  var nav = document.querySelector('.card-nav');
  if (!nav) return;

  var hamburger = nav.querySelector('.hamburger-menu');
  var content = nav.querySelector('.card-nav-content');

  function calculateExpandedHeight() {
    var contentEl = content;
    if (!contentEl) return 220;

    var wasVisible = contentEl.style.visibility;
    var wasPointerEvents = contentEl.style.pointerEvents;
    var wasPosition = contentEl.style.position;

    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';
    contentEl.style.position = 'static';
    contentEl.style.opacity = '1';

    var topBar = 52;
    var padding = 16;
    var contentHeight = contentEl.scrollHeight;

    contentEl.style.visibility = wasVisible;
    contentEl.style.pointerEvents = wasPointerEvents;
    contentEl.style.position = wasPosition;

    return topBar + contentHeight + padding;
  }

  var expandedHeight = calculateExpandedHeight();

  function setHeight(h) {
    nav.style.height = h + 'px';
  }

  function openNav() {
    hamburger.classList.add('open');
    nav.classList.add('open');
    expandedHeight = calculateExpandedHeight();
    setHeight(expandedHeight);
  }

  function closeNav() {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
    setHeight(52);
  }

  function toggleNav() {
    if (nav.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleNav();
    });
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (nav.classList.contains('open')) {
        expandedHeight = calculateExpandedHeight();
        setHeight(expandedHeight);
      }
    }, 200);
  });

  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) {
      closeNav();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeNav();
    }
  });
})();
