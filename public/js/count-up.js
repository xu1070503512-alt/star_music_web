(function () {
  var elements = document.querySelectorAll('[data-count-up]');
  if (!elements.length) return;

  var observed = new WeakSet();

  function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function animate(el, from, to, duration) {
    el.textContent = formatNumber(from);

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
        el.textContent = formatNumber(to);
        return;
      }

      el.textContent = formatNumber(current);
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  elements.forEach(function (el) {
    var from = parseInt(el.getAttribute('data-count-from') || '0', 10);
    var to = parseInt(el.getAttribute('data-count-to') || '100', 10);
    var duration = parseFloat(el.getAttribute('data-count-duration') || '2');
    var delay = parseFloat(el.getAttribute('data-count-delay') || '0');

    if (observed.has(el)) return;
    observed.add(el);

    el.textContent = formatNumber(from);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            animate(el, from, to, duration);
          }, delay * 1000);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(el);
  });
})();
