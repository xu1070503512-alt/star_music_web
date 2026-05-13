(function () {
  var elements = document.querySelectorAll('[data-count-up]');
  if (!elements.length) return;

  var observed = new WeakSet();
  var observer = null;

  function getObserver() {
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            triggerAnim(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
    }
    return observer;
  }

  function formatNumber(num, sep) {
    var s = sep || ',';
    var rounded = Math.round(num).toString();
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, s);
  }

  function triggerAnim(el) {
    var from = parseInt(el.getAttribute('data-count-from') || '0', 10);
    var to = parseInt(el.getAttribute('data-count-to') || '100', 10);
    var duration = parseFloat(el.getAttribute('data-count-duration') || '2');
    var delay = parseFloat(el.getAttribute('data-count-delay') || '0');
    var direction = el.getAttribute('data-count-direction') || 'up';
    var separator = el.getAttribute('data-count-separator') || ',';

    var startVal = direction === 'down' ? to : from;
    var endVal = direction === 'down' ? from : to;

    setTimeout(function () {
      el.textContent = formatNumber(startVal, separator);
      animate(el, startVal, endVal, duration, separator);
    }, delay * 1000);
  }

  function animate(el, from, to, duration, sep) {
    el.textContent = formatNumber(from, sep);

    var startTime = null;
    var velocity = 0;
    var current = from;
    var damping = 20 + 40 * (1 / duration);
    var stiffness = 100 * (1 / duration);

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var dt = Math.min((timestamp - startTime) / 1000, 0.1);
      startTime = timestamp;

      var springForce = (to - current) * stiffness;
      var dampingForce = velocity * damping;
      var acceleration = springForce - dampingForce;

      velocity += acceleration * dt;
      current += velocity * dt;

      if (Math.abs(to - current) < 0.5 && Math.abs(velocity) < 0.5) {
        current = to;
        el.textContent = formatNumber(to, sep);
        return;
      }

      el.textContent = formatNumber(current, sep);
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  elements.forEach(function (el) {
    if (observed.has(el)) return;
    observed.add(el);
    var from = parseInt(el.getAttribute('data-count-from') || '0', 10);
    el.textContent = formatNumber(from, el.getAttribute('data-count-separator') || ',');
    getObserver().observe(el);
  });

  window.__countUpEngine = {
    rerun: function (el) {
      if (!el) return;
      var from = parseInt(el.getAttribute('data-count-from') || '0', 10);
      el.textContent = formatNumber(from, el.getAttribute('data-count-separator') || ',');
      triggerAnim(el);
    }
  };
})();
