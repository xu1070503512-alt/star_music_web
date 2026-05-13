document.documentElement.classList.add('has-welcome');

(function initPhysicsScroll() {
  var welcomePage = document.querySelector('.welcome-page');
  if (!welcomePage) return;

  var sections = Array.from(welcomePage.querySelectorAll('.welcome-hero, .section-panel'));
  if (!sections.length) return;

  var sectionTops = [];
  var sectionCenters = [];
  var scrollMax = 0;

  function recalcGeometry() {
    sectionTops = sections.map(function (s) { return s.offsetTop; });
    sectionCenters = sectionTops.map(function (t, i) {
      var h = sections[i].offsetHeight;
      return t + h / 2 - window.innerHeight / 2;
    });
    scrollMax = sectionTops[sectionTops.length - 1];
  }
  recalcGeometry();
  window.addEventListener('resize', function () {
    recalcGeometry();
    position = clamp(position);
  });

  // ── State ──────────────────────────────────────────
  var position = 0;
  var velocity = 0;
  var baseFriction = 2.7;
  var centerGravity = 2.0;
  var wheelImpulse = 0.60;
  var edgeDampingWidth = 0.18;
  var edgeFrictionMul = 2.0;
  var snapEase = 0.16;
  var snapThreshold = 3.0;
  var idleBeforeSnap = 150;
  var lastInputTime = 0;
  var isSnapping = false;
  var snapTarget = 0;
  var activeSection = 0;

  window.__welcomeScrollY = position;

  function nearestSectionCenter(y) {
    var best = sectionCenters[0];
    var bestDist = Math.abs(y - best);
    for (var i = 1; i < sectionCenters.length; i++) {
      var d = Math.abs(y - sectionCenters[i]);
      if (d < bestDist) { best = sectionCenters[i]; bestDist = d; }
    }
    return best;
  }

  function nearestSectionTop(y) {
    var best = sectionTops[0];
    var bestDist = Math.abs(y - best);
    for (var i = 1; i < sectionTops.length; i++) {
      var d = Math.abs(y - sectionTops[i]);
      if (d < bestDist) { best = sectionTops[i]; bestDist = d; }
    }
    return best;
  }

  function clamp(y) {
    if (!sectionTops.length) return y;
    return Math.max(sectionTops[0] - 60, Math.min(y, scrollMax + 60));
  }

  // ── Edge damping ───────────────────────────────────
  function edgeDampingFactor(pos) {
    for (var i = 1; i < sectionTops.length; i++) {
      var boundary = sectionTops[i];
      var prevCenter = sectionCenters[i - 1];
      var nextCenter = sectionCenters[i];
      var halfRange = (nextCenter - prevCenter) / 2;

      var distFromBoundary = Math.abs(pos - boundary) / halfRange;
      if (distFromBoundary < edgeDampingWidth) {
        return 1 + (edgeFrictionMul - 1) * (1 - distFromBoundary / edgeDampingWidth);
      }
    }
    return 1;
  }

  // ── Center gravity spring ──────────────────────────
  function computeCenterGravity(pos) {
    var center = nearestSectionCenter(pos);
    var dist = center - pos;
    var maxDist = window.innerHeight * 0.6;
    if (Math.abs(dist) > maxDist) dist = Math.sign(dist) * maxDist;
    var norm = dist / maxDist;
    return norm * Math.abs(norm) * centerGravity * 60;
  }

  // ── Input ──────────────────────────────────────────
  function onWheel(e) {
    var modal = document.getElementById('auth-modal');
    if (modal && modal.classList.contains('active')) return;
    e.preventDefault();

    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;

    velocity += delta * wheelImpulse;
    lastInputTime = performance.now();
    isSnapping = false;
  }

  var touchStartY = 0, touchLastY = 0, touchVelocities = [], touchActive = false;

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchLastY = touchStartY;
    touchVelocities = [];
    touchActive = true;
    isSnapping = false;
  }
  function onTouchMove(e) {
    if (!touchActive || e.touches.length !== 1) return;
    var y = e.touches[0].clientY;
    var dy = touchLastY - y;
    touchLastY = y;
    position += dy;
    position = clamp(position);
    velocity = 0;
    var now = performance.now();
    touchVelocities.push({ t: now, dy: dy });
    while (touchVelocities.length > 10) touchVelocities.shift();
    lastInputTime = now;
  }
  function onTouchEnd() {
    touchActive = false;
    lastInputTime = performance.now();
    if (touchVelocities.length >= 2) {
      var first = touchVelocities[0];
      var last = touchVelocities[touchVelocities.length - 1];
      var dt = (last.t - first.t) / 1000;
      if (dt > 0.005) {
        var totalDy = 0;
        for (var i = 0; i < touchVelocities.length; i++) totalDy += touchVelocities[i].dy;
        velocity = (totalDy / dt) * 0.25;
      }
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);

  // ── Side Nav Dots ─────────────────────────────────
  var sideNav = document.createElement('nav');
  sideNav.className = 'section-nav-dots';
  sideNav.setAttribute('aria-label', 'Section navigation');
  sections.forEach(function (_s, i) {
    var dot = document.createElement('button');
    dot.className = 'section-nav-dot';
    dot.setAttribute('aria-label', 'Go to section ' + (i + 1));
    dot.addEventListener('click', function () {
      snapTarget = sectionCenters[i];
      isSnapping = true;
      lastInputTime = performance.now();
    });
    sideNav.appendChild(dot);
  });
  document.body.appendChild(sideNav);

  function updateNavDots() {
    var dots = sideNav.querySelectorAll('.section-nav-dot');
    var nearest = nearestSectionTop(position);
    dots.forEach(function (d, i) {
      d.classList.toggle('active', sectionTops[i] === nearest);
    });
  }

  // ── Animate ───────────────────────────────────────
  function animate(timestamp) {
    if (!animate.lastTime) animate.lastTime = timestamp;
    var dt = Math.min((timestamp - animate.lastTime) / 1000, 0.1);
    animate.lastTime = timestamp;

    if (isSnapping) {
      position += (snapTarget - position) * snapEase;
      if (Math.abs(snapTarget - position) < 0.5) {
        position = snapTarget;
        velocity = 0;
        isSnapping = false;
      }
    } else {
      var idle = timestamp - lastInputTime;
      var effectiveFriction = baseFriction * edgeDampingFactor(position);

      position += velocity * dt;
      position = clamp(position);

      velocity *= Math.exp(-effectiveFriction * dt);

      var grav = computeCenterGravity(position);
      velocity += grav * dt;

      if (idle > idleBeforeSnap && Math.abs(velocity) < snapThreshold) {
        var target = nearestSectionTop(position);
        if (Math.abs(target - position) > 2) {
          snapTarget = target;
          isSnapping = true;
        }
      }
    }

    window.__welcomeScrollY = position;
    welcomePage.style.transform = 'translateY(' + (-position).toFixed(1) + 'px)';
    updateNavDots();
    requestAnimationFrame(animate);
  }
  animate.lastTime = 0;
  requestAnimationFrame(animate);
})();

// ── Auth Modal ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.getElementById('auth-modal');
  if (!overlay) return;
  var closeBtn = overlay.querySelector('.modal-close');
  var tabs = overlay.querySelectorAll('.modal-tab');
  var panels = overlay.querySelectorAll('.modal-panel');
  var switchLinks = overlay.querySelectorAll('.link-switch-tab');
  var loginBtns = document.querySelectorAll('#btn-login, #nav-card-login');
  var registerBtns = document.querySelectorAll('#btn-register, #nav-btn-register, #nav-card-register');

  function switchToTab(tab) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    panels.forEach(function (p) { p.classList.toggle('active', p.dataset.panel === tab); });
  }
  function openModal(tab) { switchToTab(tab); overlay.classList.add('active'); }
  function closeModal() { overlay.classList.remove('active'); }

  loginBtns.forEach(function (btn) { btn.addEventListener('click', function (e) { e.preventDefault(); openModal('login'); }); });
  registerBtns.forEach(function (btn) { btn.addEventListener('click', function (e) { e.preventDefault(); openModal('register'); }); });
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  tabs.forEach(function (tab) { tab.addEventListener('click', function () { switchToTab(tab.dataset.tab); }); });
  switchLinks.forEach(function (link) { link.addEventListener('click', function (e) { e.preventDefault(); switchToTab(link.dataset.tab); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal(); });

  // Auto-open from URL params
  var params = new URLSearchParams(window.location.search);
  var autoTab = params.get('auth');
  if (autoTab === 'login' || autoTab === 'register') {
    openModal(autoTab);
    window.history.replaceState({}, '', window.location.pathname);
  }
  if (params.get('registered') === '1') {
    openModal('login');
    window.history.replaceState({}, '', window.location.pathname);
  }
  var errorMsg = params.get('error');
  if (errorMsg) {
    var errEl = document.getElementById('auth-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'auth-error';
      errEl.style.cssText = 'color:#ff5c5c;font-size:0.8rem;margin:10px 0;text-align:center';
      var form = overlay.querySelector('.modal-panel.active form') || overlay.querySelector('form');
      if (form) form.parentNode.insertBefore(errEl, form);
    }
    errEl.textContent = decodeURIComponent(errorMsg);
    window.history.replaceState({}, '', window.location.pathname);
  }
});
