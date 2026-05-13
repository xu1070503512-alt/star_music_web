(function () {
  var stage = document.querySelector('.panel-stage');
  if (!stage) return;

  var position = 0;
  var velocity = 0;
  var scrollMax = 0;
  var lastInputTime = 0;
  var baseFriction = 2.7;
  var wheelImpulse = 0.60;
  var overscroll = 80;

  function clamp(v) {
    return Math.max(-overscroll, Math.min(scrollMax + overscroll, v));
  }

  function recalcGeometry() {
    scrollMax = Math.max(0, stage.scrollHeight - window.innerHeight + 80);
    position = clamp(position);
  }

  function isVisualizerActive() {
    var ctx = window.__STAR_MUSIC_HOME__ || {};
    return ctx.currentPage === 'visualizer';
  }

  function onWheel(e) {
    var modal = document.getElementById('auth-modal');
    if (modal && modal.classList.contains('active')) return;

    if (isVisualizerActive()) return;

    e.preventDefault();

    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;

    velocity += delta * wheelImpulse;
    lastInputTime = performance.now();
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  var touchStartY = 0, touchLastY = 0, touchVelocities = [], touchActive = false;

  function onTouchStart(e) {
    if (isVisualizerActive()) return;
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchLastY = touchStartY;
    touchVelocities = [];
    touchActive = true;
  }

  function onTouchMove(e) {
    if (isVisualizerActive()) return;
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

  stage.addEventListener('touchstart', onTouchStart, { passive: false });
  stage.addEventListener('touchmove', onTouchMove, { passive: false });
  stage.addEventListener('touchend', onTouchEnd);
  stage.addEventListener('touchcancel', onTouchEnd);

  var bounceStiffness = 300;

  function animate(timestamp) {
    if (!animate.lastTime) animate.lastTime = timestamp;
    var dt = Math.min((timestamp - animate.lastTime) / 1000, 0.1);
    animate.lastTime = timestamp;

    position += velocity * dt;

    if (position < 0) {
      velocity += (-position * bounceStiffness - velocity * 8) * dt;
    } else if (position > scrollMax) {
      velocity += ((scrollMax - position) * bounceStiffness - velocity * 8) * dt;
    } else {
      velocity *= Math.exp(-baseFriction * dt);
    }

    position = clamp(position);
    if (Math.abs(position) < 0.01) position = 0;
    if (position < 0 && Math.abs(velocity) < 0.5 && Math.abs(position) < 2) {
      position = 0;
      velocity = 0;
    }
    if (position > scrollMax && Math.abs(velocity) < 0.5 && Math.abs(position - scrollMax) < 2) {
      position = scrollMax;
      velocity = 0;
    }

    stage.style.transform = 'translateY(' + (-position).toFixed(1) + 'px)';
    requestAnimationFrame(animate);
  }
  animate.lastTime = 0;

  recalcGeometry();
  window.addEventListener('resize', function () {
    recalcGeometry();
  });

  requestAnimationFrame(animate);

  window.__physicsScroll = {
    reset: function () {
      position = 0;
      velocity = 0;
      recalcGeometry();
    },
    recalc: recalcGeometry,
    getPosition: function () { return position; }
  };
})();
