(function () {
  var container = document.getElementById('hero-canvas-container');
  if (!container) return;

  var COLORS = {
    primary: 0x7c5cff,
    secondary: 0x19d3ff,
    accent: 0xff4f9a,
    warm: 0xff9f4f,
    white: 0xf5f7ff
  };

  var width, height;
  var scene, camera, renderer;
  var core, ringA, ringB, ringC;
  var particles;
  var clock;
  var group;

  var isDragging = false;
  var prevPointerX = 0, prevPointerY = 0;
  var velocityX = 0, velocityY = 0;
  var mouseNormX = 0, mouseNormY = 0;
  var targetRotX = 0, targetRotY = 0;

  var autoMode = false;
  var autoTargetRX = 0, autoTargetRY = 0;
  var autoLerpSpeed = 0.5;
  var autoIdleThreshold = 3000;
  var lastInteractionTime = 0;
  var takeoverActive = false;
  var takeoverStart = 0;
  var takeoverFromRX = 0, takeoverFromRY = 0;
  var takeoverDuration = 0.25;

  var mouseIsHoverInside = false;

  function createCore() {
    var geo = new THREE.IcosahedronGeometry(0.55, 2);
    var matSolid = new THREE.MeshPhysicalMaterial({
      color: COLORS.primary,
      emissive: COLORS.primary,
      emissiveIntensity: 0.45,
      metalness: 0.1,
      roughness: 0.25,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2
    });
    var matWire = new THREE.MeshBasicMaterial({
      color: COLORS.secondary,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    var solid = new THREE.Mesh(geo, matSolid);
    var wire = new THREE.Mesh(geo, matWire);
    wire.scale.set(1.06, 1.06, 1.06);
    var coreGroup = new THREE.Group();
    coreGroup.add(solid);
    coreGroup.add(wire);
    coreGroup.name = 'core';
    return coreGroup;
  }

  function createRing(radius, tubeRadius, color, segments, opacity) {
    var geo = new THREE.TorusGeometry(radius, tubeRadius, 16, segments);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: opacity
    });
    return new THREE.Mesh(geo, mat);
  }

  function createRingWire(radius, tubeRadius, color, segments, opacity) {
    var geo = new THREE.TorusGeometry(radius, tubeRadius, 8, segments);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: opacity
    });
    return new THREE.Mesh(geo, mat);
  }

  function createParticles() {
    var count = 800;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 1.2 + Math.random() * 2.6 + (Math.random() > 0.7 ? Math.random() * 2 : 0);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: COLORS.white,
      size: 0.022,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.65
    });
    var pts = new THREE.Points(geo, mat);
    pts.name = 'particles';
    return pts;
  }

  function createLighting() {
    var ambient = new THREE.AmbientLight(0x1a1a3e, 0.8);
    group.add(ambient);
    var keyLight = new THREE.PointLight(COLORS.primary, 2.8, 8);
    keyLight.position.set(2, 1.5, 2);
    group.add(keyLight);
    var fillLight = new THREE.PointLight(COLORS.secondary, 2.0, 6);
    fillLight.position.set(-2, -0.8, -1.5);
    group.add(fillLight);
    var rimLight = new THREE.PointLight(COLORS.accent, 1.6, 5);
    rimLight.position.set(0, 1.2, -2.5);
    group.add(rimLight);
    var warmLight = new THREE.PointLight(COLORS.warm, 0.8, 4);
    warmLight.position.set(-1.5, -1.2, 1);
    group.add(warmLight);
  }

  function buildScene() {
    group = new THREE.Group();
    core = createCore();
    group.add(core);
    ringA = createRing(1.05, 0.022, COLORS.secondary, 128, 0.5);
    ringA.rotation.x = Math.PI * 0.42;
    ringA.rotation.y = Math.PI * 0.18;
    group.add(ringA);
    ringB = createRing(1.35, 0.026, COLORS.primary, 100, 0.35);
    ringB.rotation.x = Math.PI * 0.68;
    ringB.rotation.y = -Math.PI * 0.22;
    group.add(ringB);
    ringC = createRing(1.65, 0.018, COLORS.accent, 90, 0.28);
    ringC.rotation.x = Math.PI * 0.28;
    ringC.rotation.y = Math.PI * 0.5;
    group.add(ringC);
    var wireRingA = createRingWire(1.25, 0.012, COLORS.secondary, 72, 0.22);
    wireRingA.rotation.x = Math.PI * 0.55;
    wireRingA.rotation.y = -Math.PI * 0.35;
    group.add(wireRingA);
    var wireRingB = createRingWire(1.52, 0.014, COLORS.primary, 64, 0.18);
    wireRingB.rotation.x = Math.PI * 0.15;
    wireRingB.rotation.y = Math.PI * 0.6;
    group.add(wireRingB);
    particles = createParticles();
    group.add(particles);
    createLighting();
    scene.add(group);
  }

  function resize() {
    var rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function pickAutoTarget() {
    autoTargetRX = (Math.random() - 0.5) * Math.PI * 0.42;
    autoTargetRY = (Math.random() - 0.5) * Math.PI * 0.65;
  }

  function isPointInside(clientX, clientY) {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function updateAutoDemo(dt, now) {
    if (takeoverActive) {
      var t = (now - takeoverStart) / (takeoverDuration * 1000);
      if (t >= 1) {
        takeoverActive = false;
        autoMode = false;
        targetRotX = mouseNormY * Math.PI * 0.22;
        targetRotY = mouseNormX * Math.PI * 0.32;
      } else {
        var k = t * t * (3 - 2 * t);
        var destRX = mouseNormY * Math.PI * 0.22;
        var destRY = mouseNormX * Math.PI * 0.32;
        targetRotX = takeoverFromRX + (destRX - takeoverFromRX) * k;
        targetRotY = takeoverFromRY + (destRY - takeoverFromRY) * k;
      }
      return;
    }
    if (!autoMode && now - lastInteractionTime > autoIdleThreshold && !isDragging) {
      autoMode = true;
      pickAutoTarget();
    }
    if (autoMode) {
      var speed = 1 - Math.exp(-autoLerpSpeed * dt);
      targetRotX += (autoTargetRX - targetRotX) * speed;
      targetRotY += (autoTargetRY - targetRotY) * speed;
      var dx = autoTargetRX - targetRotX;
      var dy = autoTargetRY - targetRotY;
      if (Math.sqrt(dx * dx + dy * dy) < 0.012) pickAutoTarget();
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.1);
    var elapsed = clock.elapsedTime;
    var now = performance.now();

    if (!isDragging) updateAutoDemo(dt, now);

    if (!isDragging) {
      var hoverLerp = 1 - Math.exp(-1.5 * dt);
      var decayRate = 2.8;
      velocityX *= Math.exp(-decayRate * dt);
      velocityY *= Math.exp(-decayRate * dt);
      group.rotation.y += velocityX * dt + (targetRotY - group.rotation.y) * hoverLerp + 0.28 * dt;
      group.rotation.x += velocityY * dt + (targetRotX - group.rotation.x) * hoverLerp;
    }

    var breathe = 1 + Math.sin(elapsed * 0.7) * 0.08;
    core.scale.setScalar(breathe);
    core.children.forEach(function (c) {
      if (c.material && c.material.emissiveIntensity !== undefined) {
        c.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 1.4) * 0.2;
      }
      if (c.material && c.material.wireframe) {
        c.material.opacity = 0.18 + Math.sin(elapsed * 1.2 + 1) * 0.1;
      }
    });

    ringA.rotation.z += 0.18 * dt;
    ringB.rotation.z -= 0.14 * dt;
    ringC.rotation.z += 0.22 * dt;
    ringA.rotation.x += 0.06 * Math.sin(elapsed * 0.5) * dt;
    ringB.rotation.y += 0.07 * Math.cos(elapsed * 0.6) * dt;

    if (ringA.material && ringA.material.emissiveIntensity !== undefined) {
      ringA.material.emissiveIntensity = 0.32 + Math.sin(elapsed * 0.8) * 0.1;
    }
    if (ringB.material && ringB.material.emissiveIntensity !== undefined) {
      ringB.material.emissiveIntensity = 0.32 + Math.sin(elapsed * 0.9 + 2) * 0.1;
    }
    if (ringC.material && ringC.material.emissiveIntensity !== undefined) {
      ringC.material.emissiveIntensity = 0.25 + Math.sin(elapsed * 1.0 + 4) * 0.08;
    }

    if (particles) {
      particles.rotation.y -= 0.1 * dt;
      particles.rotation.x += 0.04 * dt;
      particles.rotation.y -= mouseNormX * 0.06 * dt;
      particles.rotation.x += mouseNormY * 0.06 * dt;
    }

    renderer.render(scene, camera);
  }

  function onPointerDown(e) {
    if (e.target.closest('button, a, input, .modal-overlay, .modal-card, .card-nav-container, .mobile-menu-popover')) return;
    lastInteractionTime = performance.now();
    if (autoMode) {
      autoMode = false;
      takeoverActive = false;
    }
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    container.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    lastInteractionTime = performance.now();
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = (e.clientY / window.innerHeight) * 2 - 1;
    mouseIsHoverInside = isPointInside(e.clientX, e.clientY);

    if (autoMode && !isDragging && mouseIsHoverInside) {
      takeoverActive = true;
      takeoverStart = performance.now();
      takeoverFromRX = targetRotX;
      takeoverFromRY = targetRotY;
      autoMode = false;
    }

    if (!takeoverActive && mouseIsHoverInside) {
      targetRotX = mouseNormY * Math.PI * 0.22;
      targetRotY = mouseNormX * Math.PI * 0.32;
    }

    if (!isDragging) return;

    var dx = e.clientX - prevPointerX;
    var dy = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    velocityX = dx * 0.005;
    velocityY = dy * 0.005;
    group.rotation.y += dx * 0.005;
    group.rotation.x += dy * 0.005;
  }

  function onPointerUp() {
    isDragging = false;
    targetRotX = group.rotation.x;
    targetRotY = group.rotation.y;
    mouseIsHoverInside = false;
  }

  function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
    camera.position.set(0, 0, 5.2);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    clock = new THREE.Clock();
    resize();
    buildScene();
    pickAutoTarget();
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', resize);
    animate();
  }

  if (typeof THREE === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.onload = init;
    document.head.appendChild(script);
  } else {
    init();
  }
})();
