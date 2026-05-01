(function () {
  var elements = document.querySelectorAll('[data-blur-text]');
  if (!elements.length) return;

  function splitIntoChars(el, text) {
    el.classList.add('blur-text');
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'blur-text char';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
    }
  }

  function splitIntoWords(el, text) {
    el.classList.add('blur-text');
    var words = text.split(' ');
    for (var i = 0; i < words.length; i++) {
      var span = document.createElement('span');
      span.className = 'blur-text word';
      span.textContent = words[i];
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    }
  }

  function animate(el) {
    var mode = el.getAttribute('data-blur-text');
    var delayStr = el.getAttribute('data-blur-delay') || '200';
    var durationStr = el.getAttribute('data-blur-duration') || '0.7';
    var delay = parseInt(delayStr, 10);
    var duration = parseFloat(durationStr);

    var text = el.textContent.trim();
    el.textContent = '';
    el.style.setProperty('--blur-duration', duration + 's');

    if (mode === 'chars') {
      splitIntoChars(el, text);
    } else {
      splitIntoWords(el, text);
    }

    var children = el.querySelectorAll('.blur-text');
    children.forEach(function (child, i) {
      child.style.setProperty('--blur-delay', (i * delay) + 'ms');
      child.style.animationDelay = (i * delay) + 'ms';
      child.style.animationDuration = duration + 's';

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            child.classList.add('animate-top');
            observer.unobserve(child);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(child);
    });

    requestAnimationFrame(function () {
      children.forEach(function (child) {
        child.classList.add('animate-top');
      });
    });
  }

  elements.forEach(animate);
})();
