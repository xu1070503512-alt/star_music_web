(function () {
  var container = document.getElementById('magicRingsContainer');
  if (!container) return;

  var vertexShader = [
    'void main() {',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var fragmentShader = [
    'precision highp float;',
    'uniform float uTime, uAttenuation, uLineThickness;',
    'uniform float uBaseRadius, uRadiusStep, uScaleRate;',
    'uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;',
    'uniform float uFadeIn, uFadeOut;',
    'uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;',
    'uniform vec2 uResolution, uMouse;',
    'uniform vec3 uColor, uColorTwo;',
    'uniform int uRingCount;',
    'const float HP = 1.5707963;',
    'const float CYCLE = 3.45;',
    'float fade(float t) {',
    '  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);',
    '}',
    'float ring(vec2 p, float ri, float cut, float t0, float px) {',
    '  float t = mod(uTime + t0, CYCLE);',
    '  float r = ri + t / CYCLE * uScaleRate;',
    '  float d = abs(length(p) - r);',
    '  float a = atan(abs(p.y), abs(p.x)) / HP;',
    '  float th = max(1.0 - a, 0.5) * px * uLineThickness;',
    '  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;',
    '  d += pow(cut * a, 3.0) * r;',
    '  return h * exp(-uAttenuation * d) * fade(t);',
    '}',
    'void main() {',
    '  float px = 1.0 / min(uResolution.x, uResolution.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;',
    '  float cr = cos(uRotation), sr = sin(uRotation);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p -= uMouse * uMouseInfluence;',
    '  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;',
    '  p /= sc;',
    '  vec3 c = vec3(0.0);',
    '  float rcf = max(float(uRingCount) - 1.0, 1.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    if (i >= uRingCount) break;',
    '    float fi = float(i);',
    '    vec2 pr = p - fi * uParallax * uMouse;',
    '    vec3 rc = mix(uColor, uColorTwo, fi / rcf);',
    '    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));',
    '  }',
    '  c *= 1.0 + uBurst * 2.0;',
    '  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (n - 0.5) * uNoiseAmount;',
    '  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);',
    '}'
  ].join('\n');

  var renderer, scene, camera, quad, uniforms;
  var mouse = [0, 0], smoothMouse = [0, 0];
  var hoverAmount = 0, isHovered = false, burst = 0;
  var frameId;
  var cfg = {
    color: '#ffffff',
    colorTwo: '#c8c9ff',
    speed: 1,
    ringCount: 6,
    attenuation: 10,
    lineThickness: 2,
    baseRadius: 0.35,
    radiusStep: 0.1,
    scaleRate: 0.1,
    opacity: 1,
    noiseAmount: 0.1,
    rotation: 0,
    ringGap: 1.5,
    fadeIn: 0.7,
    fadeOut: 0.5,
    followMouse: true,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    parallax: 0.05,
    clickBurst: false
  };

  function init() {
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return;
    }
    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: cfg.attenuation },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(cfg.color) },
      uColorTwo: { value: new THREE.Color(cfg.colorTwo) },
      uLineThickness: { value: cfg.lineThickness },
      uBaseRadius: { value: cfg.baseRadius },
      uRadiusStep: { value: cfg.radiusStep },
      uScaleRate: { value: cfg.scaleRate },
      uRingCount: { value: cfg.ringCount },
      uOpacity: { value: cfg.opacity },
      uNoiseAmount: { value: cfg.noiseAmount },
      uRotation: { value: cfg.rotation * Math.PI / 180 },
      uRingGap: { value: cfg.ringGap },
      uFadeIn: { value: cfg.fadeIn },
      uFadeOut: { value: cfg.fadeOut },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: cfg.mouseInfluence },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: cfg.hoverScale },
      uParallax: { value: cfg.parallax },
      uBurst: { value: 0 }
    };

    var material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      transparent: true,
      depthWrite: false
    });
    quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      mouse[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouse[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    });
    document.addEventListener('mouseleave', function () {
      mouse[0] = 0; mouse[1] = 0;
      isHovered = false;
    });
    if (cfg.clickBurst) {
      container.addEventListener('click', function () { burst = 1; });
    }

    frameId = requestAnimationFrame(animate);
  }

  function resize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w === 0 || h === 0) return;
    var dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    uniforms.uResolution.value.set(w * dpr, h * dpr);
  }

  function animate(t) {
    frameId = requestAnimationFrame(animate);

    smoothMouse[0] += (mouse[0] - smoothMouse[0]) * 0.08;
    smoothMouse[1] += (mouse[1] - smoothMouse[1]) * 0.08;
    hoverAmount += ((isHovered ? 1 : 0) - hoverAmount) * 0.08;
    burst *= 0.95;
    if (burst < 0.001) burst = 0;

    uniforms.uTime.value = t * 0.001 * cfg.speed;
    uniforms.uAttenuation.value = cfg.attenuation;
    uniforms.uColor.value.set(cfg.color);
    uniforms.uColorTwo.value.set(cfg.colorTwo);
    uniforms.uLineThickness.value = cfg.lineThickness;
    uniforms.uBaseRadius.value = cfg.baseRadius;
    uniforms.uRadiusStep.value = cfg.radiusStep;
    uniforms.uScaleRate.value = cfg.scaleRate;
    uniforms.uRingCount.value = cfg.ringCount;
    uniforms.uOpacity.value = cfg.opacity;
    uniforms.uNoiseAmount.value = cfg.noiseAmount;
    uniforms.uRotation.value = (cfg.rotation * Math.PI) / 180;
    uniforms.uRingGap.value = cfg.ringGap;
    uniforms.uFadeIn.value = cfg.fadeIn;
    uniforms.uFadeOut.value = cfg.fadeOut;
    uniforms.uMouse.value.set(smoothMouse[0], smoothMouse[1]);
    uniforms.uMouseInfluence.value = cfg.followMouse ? cfg.mouseInfluence : 0;
    uniforms.uHoverAmount.value = hoverAmount;
    uniforms.uHoverScale.value = cfg.hoverScale;
    uniforms.uParallax.value = cfg.parallax;
    uniforms.uBurst.value = cfg.clickBurst ? burst : 0;

    renderer.render(scene, camera);
  }

  function loadThree(cb) {
    if (typeof THREE !== 'undefined') { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadThree(init);
})();
