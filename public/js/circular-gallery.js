(function () {
  var containers = document.querySelectorAll('[data-circular-gallery]');
  if (!containers.length) return;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  containers.forEach(function (container) {
    var originalCards = Array.from(container.querySelectorAll('.circular-gallery-card'));
    if (!originalCards.length) return;

    var speed = parseFloat(container.getAttribute('data-scroll-speed') || '2');
    var easeVal = parseFloat(container.getAttribute('data-scroll-ease') || '0.05');
    var bend = parseFloat(container.getAttribute('data-bend') || '1');

    var track = container.querySelector('.circular-gallery-track');
    if (!track) {
      track = document.createElement('div');
      track.className = 'circular-gallery-track';
      while (container.firstChild) {
        track.appendChild(container.firstChild);
      }
      container.appendChild(track);
    }

    for (var c = 0; c < 2; c++) {
      originalCards.forEach(function (card) {
        track.appendChild(card.cloneNode(true));
      });
    }

    var cards = Array.from(track.querySelectorAll('.circular-gallery-card'));
    var originalCount = originalCards.length;

    cards.forEach(function (card, i) {
      var frame = card.querySelector('.circular-gallery-card-frame');
      if (frame) frame.style.animationDelay = ((i % originalCount) * 0.35).toFixed(2) + 's';
    });

    var scroll = { current: 0, target: 0, last: 0, position: 0 };
    var isDown = false;
    var startX = 0;
    var baseCardWidth = 0;
    var gap = 32;
    var step = 0;
    var oneSetWidth = 0;

    function measure() {
      if (cards.length) {
        baseCardWidth = cards[0].offsetWidth;
      }
      var style = getComputedStyle(track);
      var gapStr = style.gap || style.columnGap;
      if (gapStr && gapStr !== 'normal') {
        gap = parseFloat(gapStr) || 32;
      }
      step = baseCardWidth + gap;
      oneSetWidth = step * originalCount;
    }

    function resetToMiddle() {
      if (oneSetWidth <= 0) return;
      while (scroll.target < oneSetWidth) {
        scroll.target += oneSetWidth;
        scroll.current += oneSetWidth;
        scroll.position += oneSetWidth;
      }
      while (scroll.target > oneSetWidth * 2) {
        scroll.target -= oneSetWidth;
        scroll.current -= oneSetWidth;
        scroll.position -= oneSetWidth;
      }
    }

    function updateCards() {
      var viewCenter = container.clientWidth / 2;
      var containerRect = container.getBoundingClientRect();
      var containerLeft = containerRect.left;

      cards.forEach(function (card, i) {
        var cardVisualX = containerLeft + i * step - scroll.current + baseCardWidth / 2;
        var offsetX = (cardVisualX - (containerLeft + viewCenter)) / viewCenter;
        offsetX = Math.max(-1, Math.min(1, offsetX));

        var rotY = offsetX * bend * 20;
        var tz = Math.abs(offsetX) * -70;
        var s = 1 - Math.abs(offsetX) * 0.06;
        var o = 1 - Math.abs(offsetX) * 0.35;

        card.style.transform =
          'perspective(1000px) rotateY(' + rotY.toFixed(2) + 'deg) translateZ(' + tz.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        card.style.opacity = o.toFixed(3);
        card.style.zIndex = Math.round((1 - Math.abs(offsetX)) * 10);
      });
    }

    track.style.transform = 'none';

    container.addEventListener('mousedown', function (e) {
      isDown = true;
      startX = e.clientX;
      scroll.position = scroll.target;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      var dx = startX - e.clientX;
      scroll.target = scroll.position + dx * speed;
      resetToMiddle();
    });

    window.addEventListener('mouseup', function () {
      isDown = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('wheel', function (e) {
      scroll.target += (e.deltaY > 0 ? speed : -speed) * 0.5;
      resetToMiddle();
      e.preventDefault();
    }, { passive: false });

    function animate() {
      scroll.current = lerp(scroll.current, scroll.target, easeVal);
      resetToMiddle();

      track.style.transform = 'translateX(' + (-scroll.current).toFixed(1) + 'px)';
      updateCards();

      scroll.last = scroll.current;
      requestAnimationFrame(animate);
    }

    measure();
    scroll.current = scroll.target = scroll.position = oneSetWidth;
    updateCards();
    animate();
  });
})();
