(function () {
  var container = document.createElement('div');
  container.className = 'gradual-blur-top';
  container.setAttribute('aria-hidden', 'true');

  var strength = 5;
  var divCount = 5;
  var curveFn = function (p) { return p * p * (3 - 2 * p); };
  var increment = 100 / divCount;

  for (var i = 1; i <= divCount; i++) {
    var progress = i / divCount;
    progress = curveFn(progress);
    var blurRem = Math.pow(2, progress * 4) * 0.0625 * strength;

    var p1 = Math.round((increment * i - increment) * 10) / 10;
    var p2 = Math.round(increment * i * 10) / 10;
    var p3 = Math.round((increment * i + increment) * 10) / 10;
    var p4 = Math.round((increment * i + increment * 2) * 10) / 10;

    var gradient = 'transparent ' + p1 + '%, black ' + p2 + '%';
    if (p3 <= 100) gradient += ', black ' + p3 + '%';
    if (p4 <= 100) gradient += ', transparent ' + p4 + '%';

    var layer = document.createElement('div');
    layer.style.cssText =
      'position:absolute;inset:0;' +
      '-webkit-mask-image:linear-gradient(to top,' + gradient + ');' +
      'mask-image:linear-gradient(to top,' + gradient + ');' +
      '-webkit-backdrop-filter:blur(' + blurRem.toFixed(3) + 'rem);' +
      'backdrop-filter:blur(' + blurRem.toFixed(3) + 'rem);';

    container.appendChild(layer);
  }

  var welcomePage = document.querySelector('.welcome-page');
  if (welcomePage && welcomePage.parentNode) {
    welcomePage.parentNode.insertBefore(container, welcomePage);
  } else {
    document.body.appendChild(container);
  }
})();
