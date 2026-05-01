(function () {
  var nav = document.querySelector('.pill-nav');
  if (!nav) return;

  var pills = nav.querySelectorAll('.pill-item');

  function layoutCircles() {
    pills.forEach(function (pill) {
      var circle = pill.querySelector('.hover-circle');
      if (!circle) return;

      var rect = pill.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      if (w === 0 || h === 0) return;

      var R = (w * w / 4 + h * h) / (2 * h);
      var D = Math.ceil(2 * R) + 2;
      var delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - w * w / 4))) + 1;

      circle.style.width = D + 'px';
      circle.style.height = D + 'px';
      circle.style.bottom = '-' + delta + 'px';
    });
  }

  layoutCircles();
  window.addEventListener('resize', layoutCircles);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutCircles).catch(function () {});
  }

  var currentPath = window.location.pathname;
  pills.forEach(function (pill) {
    var href = pill.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.indexOf(href) === 0)) {
      pill.classList.add('active');
    }
  });

  var mobileLinks = document.querySelectorAll('.mobile-menu-link');
  mobileLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.indexOf(href) === 0)) {
      link.classList.add('active');
    }
  });

  var menuBtn = nav.querySelector('.mobile-menu-btn');
  var popover = document.querySelector('.mobile-menu-popover');

  if (menuBtn && popover) {
    menuBtn.addEventListener('click', function () {
      var isOpen = popover.classList.contains('open');
      if (isOpen) {
        popover.classList.remove('open');
        menuBtn.classList.remove('open');
      } else {
        popover.classList.add('open');
        menuBtn.classList.add('open');
      }
    });

    document.addEventListener('click', function (e) {
      if (popover.classList.contains('open') &&
          !popover.contains(e.target) &&
          !menuBtn.contains(e.target)) {
        popover.classList.remove('open');
        menuBtn.classList.remove('open');
      }
    });

    var mobileLinksAll = popover.querySelectorAll('.mobile-menu-link');
    mobileLinksAll.forEach(function (link) {
      link.addEventListener('click', function () {
        popover.classList.remove('open');
        menuBtn.classList.remove('open');
      });
    });
  }
})();
