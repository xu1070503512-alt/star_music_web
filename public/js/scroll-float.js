(function () {
  var elements = document.querySelectorAll('[data-scroll-float]');
  if (!elements.length) return;

  elements.forEach(function (el) {
    var stagger = parseFloat(el.getAttribute('data-scroll-stagger') || '0.03');
    var text = el.textContent.trim();
    el.textContent = '';
    el.classList.add('scroll-float');

    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      span.style.setProperty('--char-index', i);
      span.style.setProperty('--char-stagger', stagger);
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
    }
  });

  var ticking = false;

  function updateProgress() {
    var viewportH = window.innerHeight;

    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var progress = (viewportH * 1.5 - rect.top) / (viewportH * 1.9);
      progress = Math.max(0, Math.min(1, progress));
      el.style.setProperty('--scroll-progress', progress.toFixed(4));
    });

    ticking = false;
  }

  function schedule() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });

  var rafId;
  function poll() {
    schedule();
    rafId = requestAnimationFrame(poll);
  }
  rafId = requestAnimationFrame(poll);

  updateProgress();
})();
