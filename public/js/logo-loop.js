(function () {
  var containers = document.querySelectorAll('[data-logo-loop]');
  if (!containers.length) return;

  containers.forEach(function (container) {
    var inner = container.querySelector('.logo-loop-inner');
    if (!inner) return;

    inner.innerHTML += inner.innerHTML;
  });
})();
