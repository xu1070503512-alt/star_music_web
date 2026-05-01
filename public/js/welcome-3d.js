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

  // ==================== FLUID SIMULATION ====================
  var fluidScene, fluidCamera, fluidPlane;
  var simFBOs = {};
  var cellScale, fboSize, boundarySpace;

  var simOpts = {
    mouseForce: 20,
    cursorSize: 100,
    isViscous: true,
    viscous: 5,
    iterationsViscous: 8,
    iterationsPoisson: 16,
    dt: 0.014,
    BFECC: true,
    resolution: 0.75,
    isBounce: false
  };

  var mouseCoords, mouseCoordsOld, mouseDiff;
  var mouseMoved = false;
  var mouseTimer = null;
  var mouseIsHoverInside = false;
  var mouseHasUserControl = false;
  var mouseIsAutoActive = false;
  var mouseTakeoverActive = false;
  var mouseTakeoverStart = 0;
  var mouseTakeoverFrom, mouseTakeoverTo;
  var mouseAutoIntensity = 3.5;
  var mouseTakeoverDur = 0.25;

  var autoDriver = {
    enabled: true,
    speed: 0.8,
    resumeDelay: 1000,
    rampDurationMs: 300,
    active: false,
    current: null,
    target: null,
    lastTime: 0,
    activationTime: 0,
    margin: 0.2,
    tmpDir: null,
    init: function () {
      this.current = new THREE.Vector2(0, 0);
      this.target = new THREE.Vector2();
      this.tmpDir = new THREE.Vector2();
      this.pickNewTarget();
    },
    pickNewTarget: function () {
      var r = Math.random;
      this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
    },
    forceStop: function () {
      this.active = false;
      mouseIsAutoActive = false;
    },
    update: function (now) {
      if (!this.enabled) return;
      var idle = now - lastInteractionTime;
      if (idle < this.resumeDelay) {
        if (this.active) this.forceStop();
        return;
      }
      if (mouseIsHoverInside) {
        if (this.active) this.forceStop();
        return;
      }
      if (!this.active) {
        this.active = true;
        this.current.copy(mouseCoords);
        this.lastTime = now;
        this.activationTime = now;
      }
      if (!this.active) return;
      mouseIsAutoActive = true;
      var dtSec = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dtSec > 0.2) dtSec = 0.016;
      var dir = this.tmpDir.subVectors(this.target, this.current);
      var dist = dir.length();
      if (dist < 0.01) {
        this.pickNewTarget();
        return;
      }
      dir.normalize();
      var ramp = 1;
      if (this.rampDurationMs > 0) {
        var t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
        ramp = t * t * (3 - 2 * t);
      }
      var step = this.speed * dtSec * ramp;
      var move = Math.min(step, dist);
      this.current.addScaledVector(dir, move);
      mouseCoords.set(this.current.x, this.current.y);
    }
  };

  function getFloatType() {
    var isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
    return isIOS ? THREE.HalfFloatType : THREE.FloatType;
  }

  function makePaletteTexture(stops) {
    var arr;
    if (Array.isArray(stops) && stops.length > 0) {
      arr = stops.length === 1 ? [stops[0], stops[0]] : stops;
    } else {
      arr = ['#ffffff', '#ffffff'];
    }
    var w = arr.length;
    var data = new Uint8Array(w * 4);
    for (var i = 0; i < w; i++) {
      var c = new THREE.Color(arr[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    var tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  // ---- Shader strings ----
  var faceVert = [
    'attribute vec3 position;',
    'uniform vec2 px;',
    'uniform vec2 boundarySpace;',
    'varying vec2 uv;',
    'precision highp float;',
    'void main(){',
    '  vec3 pos = position;',
    '  vec2 scale = 1.0 - boundarySpace * 2.0;',
    '  pos.xy = pos.xy * scale;',
    '  uv = vec2(0.5)+(pos.xy)*0.5;',
    '  gl_Position = vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var lineVert = [
    'attribute vec3 position;',
    'uniform vec2 px;',
    'precision highp float;',
    'varying vec2 uv;',
    'void main(){',
    '  vec3 pos = position;',
    '  uv = 0.5 + pos.xy * 0.5;',
    '  vec2 n = sign(pos.xy);',
    '  pos.xy = abs(pos.xy) - px * 1.0;',
    '  pos.xy *= n;',
    '  gl_Position = vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var mouseVert = [
    'precision highp float;',
    'attribute vec3 position;',
    'attribute vec2 uv;',
    'uniform vec2 center;',
    'uniform vec2 scale;',
    'uniform vec2 px;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 pos = position.xy * scale * 2.0 * px + center;',
    '  vUv = uv;',
    '  gl_Position = vec4(pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var advectionFrag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform float dt;',
    'uniform bool isBFECC;',
    'uniform vec2 fboSize;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;',
    '  if(isBFECC == false){',
    '    vec2 vel = texture2D(velocity, uv).xy;',
    '    vec2 uv2 = uv - vel * dt * ratio;',
    '    vec2 newVel = texture2D(velocity, uv2).xy;',
    '    gl_FragColor = vec4(newVel, 0.0, 0.0);',
    '  } else {',
    '    vec2 spot_new = uv;',
    '    vec2 vel_old = texture2D(velocity, uv).xy;',
    '    vec2 spot_old = spot_new - vel_old * dt * ratio;',
    '    vec2 vel_new1 = texture2D(velocity, spot_old).xy;',
    '    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;',
    '    vec2 error = spot_new2 - spot_new;',
    '    vec2 spot_new3 = spot_new - error / 2.0;',
    '    vec2 vel_2 = texture2D(velocity, spot_new3).xy;',
    '    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;',
    '    vec2 newVel2 = texture2D(velocity, spot_old2).xy;',
    '    gl_FragColor = vec4(newVel2, 0.0, 0.0);',
    '  }',
    '}'
  ].join('\n');

  var colorFrag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform sampler2D palette;',
    'uniform vec4 bgColor;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 vel = texture2D(velocity, uv).xy;',
    '  float lenv = clamp(length(vel), 0.0, 1.0);',
    '  vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;',
    '  vec3 outRGB = mix(bgColor.rgb, c, lenv);',
    '  float outA = mix(bgColor.a, 1.0, lenv);',
    '  gl_FragColor = vec4(outRGB, outA);',
    '}'
  ].join('\n');

  var divergenceFrag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform float dt;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;',
    '  float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;',
    '  float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;',
    '  float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;',
    '  float divergence = (x1 - x0 + y1 - y0) / 2.0;',
    '  gl_FragColor = vec4(divergence / dt);',
    '}'
  ].join('\n');

  var externalForceFrag = [
    'precision highp float;',
    'uniform vec2 force;',
    'uniform vec2 center;',
    'uniform vec2 scale;',
    'uniform vec2 px;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 circle = (vUv - 0.5) * 2.0;',
    '  float d = 1.0 - min(length(circle), 1.0);',
    '  d *= d;',
    '  gl_FragColor = vec4(force * d, 0.0, 1.0);',
    '}'
  ].join('\n');

  var poissonFrag = [
    'precision highp float;',
    'uniform sampler2D pressure;',
    'uniform sampler2D divergence;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;',
    '  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;',
    '  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;',
    '  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;',
    '  float div = texture2D(divergence, uv).r;',
    '  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;',
    '  gl_FragColor = vec4(newP);',
    '}'
  ].join('\n');

  var pressureFrag = [
    'precision highp float;',
    'uniform sampler2D pressure;',
    'uniform sampler2D velocity;',
    'uniform vec2 px;',
    'uniform float dt;',
    'varying vec2 uv;',
    'void main(){',
    '  float step = 1.0;',
    '  float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;',
    '  float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;',
    '  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;',
    '  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;',
    '  vec2 v = texture2D(velocity, uv).xy;',
    '  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;',
    '  v = v - gradP * dt;',
    '  gl_FragColor = vec4(v, 0.0, 1.0);',
    '}'
  ].join('\n');

  var viscousFrag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform sampler2D velocity_new;',
    'uniform float v;',
    'uniform vec2 px;',
    'uniform float dt;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 old = texture2D(velocity, uv).xy;',
    '  vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;',
    '  vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;',
    '  vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;',
    '  vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;',
    '  vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);',
    '  newv /= 4.0 * (1.0 + v * dt);',
    '  gl_FragColor = vec4(newv, 0.0, 0.0);',
    '}'
  ].join('\n');

  // ---- Simulation objects ----
  var passiveScene, passiveCamera;
  var advectionObj, advectionLine;
  var externalForceObj, externalForceMesh;
  var viscousObj;
  var divergenceObj;
  var poissonObj;
  var pressureObj;
  var paletteTex;
  var bgVec4;

  function renderToTarget(target, scn, cam) {
    renderer.setRenderTarget(target);
    renderer.render(scn, cam);
    renderer.setRenderTarget(null);
  }

  function calcSimSize() {
    var w = Math.max(1, Math.round(simOpts.resolution * width));
    var h = Math.max(1, Math.round(simOpts.resolution * height));
    var px_x = 1.0 / w;
    var px_y = 1.0 / h;
    cellScale.set(px_x, px_y);
    fboSize.set(w, h);
  }

  function createSimFBOs() {
    var type = getFloatType();
    var opts = {
      type: type,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    };
    simFBOs.vel_0 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.vel_1 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.vel_viscous0 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.vel_viscous1 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.div = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.pressure_0 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
    simFBOs.pressure_1 = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, opts);
  }

  function resizeSimFBOs() {
    calcSimSize();
    for (var key in simFBOs) {
      if (simFBOs[key]) simFBOs[key].setSize(fboSize.x, fboSize.y);
    }
  }

  function createSimulation() {
    paletteTex = makePaletteTexture(['#1723ff', '#1c92ff', '#4ee0f2']);
    passiveScene = new THREE.Scene();
    passiveCamera = new THREE.Camera();

    // Advection
    var advGeo = new THREE.PlaneGeometry(2, 2);
    var advUnis = {
      boundarySpace: { value: new THREE.Vector2() },
      px: { value: cellScale },
      fboSize: { value: fboSize },
      velocity: { value: simFBOs.vel_0.texture },
      dt: { value: simOpts.dt },
      isBFECC: { value: true }
    };
    var advMat = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: advectionFrag,
      uniforms: advUnis
    });
    advectionObj = new THREE.Mesh(advGeo, advMat);
    advectionObj.frustumCulled = false;
    var advScene = new THREE.Scene();
    advScene.add(advectionObj);

    var boundaryG = new THREE.BufferGeometry();
    var boundaryVerts = new Float32Array([
      -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0,
      1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0
    ]);
    boundaryG.setAttribute('position', new THREE.BufferAttribute(boundaryVerts, 3));
    var boundaryMat = new THREE.RawShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: advectionFrag,
      uniforms: advUnis
    });
    advectionLine = new THREE.LineSegments(boundaryG, boundaryMat);
    advScene.add(advectionLine);
    advectionObj.userData = { scene: advScene, uniforms: advUnis };

    // External Force
    var extGeo = new THREE.PlaneGeometry(1, 1);
    var extUnis = {
      px: { value: cellScale },
      force: { value: new THREE.Vector2(0, 0) },
      center: { value: new THREE.Vector2(0, 0) },
      scale: { value: new THREE.Vector2(simOpts.cursorSize, simOpts.cursorSize) }
    };
    var extMat = new THREE.RawShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: externalForceFrag,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: extUnis
    });
    externalForceMesh = new THREE.Mesh(extGeo, extMat);
    var extScene = new THREE.Scene();
    extScene.add(externalForceMesh);
    externalForceObj = { scene: extScene, uniforms: extUnis };

    // Viscous
    var visGeo = new THREE.PlaneGeometry(2, 2);
    var visUnis = {
      boundarySpace: { value: new THREE.Vector2() },
      velocity: { value: simFBOs.vel_1.texture },
      velocity_new: { value: simFBOs.vel_viscous0.texture },
      v: { value: simOpts.viscous },
      px: { value: cellScale },
      dt: { value: simOpts.dt }
    };
    var visMat = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: viscousFrag,
      uniforms: visUnis
    });
    var visMesh = new THREE.Mesh(visGeo, visMat);
    visMesh.frustumCulled = false;
    var visScene = new THREE.Scene();
    visScene.add(visMesh);
    viscousObj = { scene: visScene, uniforms: visUnis };

    // Divergence
    var divGeo2 = new THREE.PlaneGeometry(2, 2);
    var divUnis = {
      boundarySpace: { value: new THREE.Vector2() },
      velocity: { value: simFBOs.vel_1.texture },
      px: { value: cellScale },
      dt: { value: simOpts.dt }
    };
    var divMat2 = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: divergenceFrag,
      uniforms: divUnis
    });
    var divMesh2 = new THREE.Mesh(divGeo2, divMat2);
    divMesh2.frustumCulled = false;
    var divScene2 = new THREE.Scene();
    divScene2.add(divMesh2);
    divergenceObj = { scene: divScene2, uniforms: divUnis };

    // Poisson
    var poiGeo = new THREE.PlaneGeometry(2, 2);
    var poiUnis = {
      boundarySpace: { value: new THREE.Vector2() },
      pressure: { value: simFBOs.pressure_0.texture },
      divergence: { value: simFBOs.div.texture },
      px: { value: cellScale }
    };
    var poiMat = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: poissonFrag,
      uniforms: poiUnis
    });
    var poiMesh = new THREE.Mesh(poiGeo, poiMat);
    poiMesh.frustumCulled = false;
    var poiScene = new THREE.Scene();
    poiScene.add(poiMesh);
    poissonObj = { scene: poiScene, uniforms: poiUnis };

    // Pressure
    var presGeo = new THREE.PlaneGeometry(2, 2);
    var presUnis = {
      boundarySpace: { value: new THREE.Vector2() },
      pressure: { value: simFBOs.pressure_0.texture },
      velocity: { value: simFBOs.vel_viscous0.texture },
      px: { value: cellScale },
      dt: { value: simOpts.dt }
    };
    var presMat = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: pressureFrag,
      uniforms: presUnis
    });
    var presMesh = new THREE.Mesh(presGeo, presMat);
    presMesh.frustumCulled = false;
    var presScene = new THREE.Scene();
    presScene.add(presMesh);
    pressureObj = { scene: presScene, uniforms: presUnis };

    // Output (color render)
    fluidScene = new THREE.Scene();
    fluidCamera = new THREE.Camera();
    var fluidGeo = new THREE.PlaneGeometry(2, 2);
    var fluidMat = new THREE.RawShaderMaterial({
      vertexShader: faceVert,
      fragmentShader: colorFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        velocity: { value: simFBOs.vel_0.texture },
        boundarySpace: { value: new THREE.Vector2() },
        palette: { value: paletteTex },
        bgColor: { value: bgVec4 }
      }
    });
    fluidPlane = new THREE.Mesh(fluidGeo, fluidMat);
    fluidPlane.frustumCulled = false;
    fluidScene.add(fluidPlane);
  }

  function runSimulation() {
    if (simOpts.isBounce) {
      boundarySpace.set(0, 0);
    } else {
      boundarySpace.copy(cellScale);
    }

    // 1. Advection: vel_0 → vel_1
    var au = advectionObj.userData.uniforms;
    au.boundarySpace.value.copy(boundarySpace);
    au.dt.value = simOpts.dt;
    au.isBFECC.value = simOpts.BFECC;
    advectionLine.visible = simOpts.isBounce;
    renderToTarget(simFBOs.vel_1, advectionObj.userData.scene, passiveCamera);

    // 2. External Force → vel_1 (additive)
    var forceX = (mouseDiff.x / 2) * simOpts.mouseForce;
    var forceY = (mouseDiff.y / 2) * simOpts.mouseForce;
    var cursorSizeX = simOpts.cursorSize * cellScale.x;
    var cursorSizeY = simOpts.cursorSize * cellScale.y;
    var centerX = Math.min(Math.max(mouseCoords.x, -1 + cursorSizeX + cellScale.x * 2), 1 - cursorSizeX - cellScale.x * 2);
    var centerY = Math.min(Math.max(mouseCoords.y, -1 + cursorSizeY + cellScale.y * 2), 1 - cursorSizeY - cellScale.y * 2);
    var eu = externalForceObj.uniforms;
    eu.force.value.set(forceX, forceY);
    eu.center.value.set(centerX, centerY);
    eu.scale.value.set(simOpts.cursorSize, simOpts.cursorSize);
    renderToTarget(simFBOs.vel_1, externalForceObj.scene, passiveCamera);

    // 3. Viscous (optional)
    var velAfterViscous = simFBOs.vel_1;
    if (simOpts.isViscous) {
      var vu = viscousObj.uniforms;
      vu.v.value = simOpts.viscous;
      for (var vi = 0; vi < simOpts.iterationsViscous; vi++) {
        var visIn, visOut;
        if (vi % 2 === 0) {
          visIn = simFBOs.vel_viscous0;
          visOut = simFBOs.vel_viscous1;
        } else {
          visIn = simFBOs.vel_viscous1;
          visOut = simFBOs.vel_viscous0;
        }
        vu.velocity_new.value = visIn.texture;
        vu.boundarySpace.value.copy(boundarySpace);
        vu.dt.value = simOpts.dt;
        if (vi === 0) {
          vu.velocity.value = simFBOs.vel_1.texture;
        }
        renderToTarget(visOut, viscousObj.scene, passiveCamera);
      }
      velAfterViscous = (simOpts.iterationsViscous % 2 === 1) ? simFBOs.vel_viscous1 : simFBOs.vel_viscous0;
    }

    // 4. Divergence
    var du = divergenceObj.uniforms;
    du.velocity.value = velAfterViscous.texture;
    du.boundarySpace.value.copy(boundarySpace);
    renderToTarget(simFBOs.div, divergenceObj.scene, passiveCamera);

    // 5. Poisson (Jacobi iterations)
    var pou = poissonObj.uniforms;
    for (var pi = 0; pi < simOpts.iterationsPoisson; pi++) {
      var pIn, pTarget;
      if (pi % 2 === 0) {
        pIn = simFBOs.pressure_0;
        pTarget = simFBOs.pressure_1;
      } else {
        pIn = simFBOs.pressure_1;
        pTarget = simFBOs.pressure_0;
      }
      pou.pressure.value = pIn.texture;
      pou.boundarySpace.value.copy(boundarySpace);
      renderToTarget(pTarget, poissonObj.scene, passiveCamera);
    }
    var pOut = (simOpts.iterationsPoisson % 2 === 1) ? simFBOs.pressure_1 : simFBOs.pressure_0;

    // 6. Pressure projection → vel_0
    var pru = pressureObj.uniforms;
    pru.velocity.value = velAfterViscous.texture;
    pru.pressure.value = pOut.texture;
    pru.boundarySpace.value.copy(boundarySpace);
    pru.dt.value = simOpts.dt;
    renderToTarget(simFBOs.vel_0, pressureObj.scene, passiveCamera);
  }

  // ==================== 3D SCENE ====================
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
    resizeSimFBOs();
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

  function updateFluidMouse(clientX, clientY) {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    var nx = (clientX - rect.left) / rect.width;
    var ny = (clientY - rect.top) / rect.height;
    mouseCoords.set(nx * 2 - 1, -(ny * 2 - 1));
    mouseMoved = true;
    if (mouseTimer) clearTimeout(mouseTimer);
    mouseTimer = setTimeout(function () { mouseMoved = false; }, 100);
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
      if (Math.sqrt(dx * dx + dy * dy) < 0.012) {
        pickAutoTarget();
      }
    }
  }

  function updateFluidAutoDemo(now) {
    // Mouse takeover logic
    if (mouseTakeoverActive) {
      var t = (now - mouseTakeoverStart) / (mouseTakeoverDur * 1000);
      if (t >= 1) {
        mouseTakeoverActive = false;
        mouseCoords.copy(mouseTakeoverTo);
        mouseCoordsOld.copy(mouseCoords);
        mouseDiff.set(0, 0);
      } else {
        var k = t * t * (3 - 2 * t);
        mouseCoords.copy(mouseTakeoverFrom).lerp(mouseTakeoverTo, k);
      }
    }

    mouseDiff.subVectors(mouseCoords, mouseCoordsOld);
    mouseCoordsOld.copy(mouseCoords);
    if (mouseCoordsOld.x === 0 && mouseCoordsOld.y === 0) mouseDiff.set(0, 0);
    if (mouseIsAutoActive && !mouseTakeoverActive) mouseDiff.multiplyScalar(mouseAutoIntensity);
  }

  function animate() {
    requestAnimationFrame(animate);

    var dt = Math.min(clock.getDelta(), 0.1);
    var elapsed = clock.elapsedTime;
    var now = performance.now();

    // Fluid simulation
    autoDriver.update(now);
    updateFluidAutoDemo(now);
    runSimulation();

    // 3D core animation
    if (!isDragging) {
      updateAutoDemo(dt, now);
    }

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

    // Render fluid → screen, then 3D scene on top
    renderer.autoClear = true;
    renderer.clear();
    renderer.render(fluidScene, fluidCamera);
    renderer.autoClear = false;
    renderer.render(scene, camera);
    renderer.autoClear = true;
  }

  function onPointerDown(e) {
    if (e.target.closest('button, a, input, .modal-overlay, .modal-card, .card-nav-container, .mobile-menu-popover')) return;

    lastInteractionTime = performance.now();
    if (autoMode) {
      autoMode = false;
      takeoverActive = false;
    }

    // Fluid takeover
    if (mouseIsAutoActive && !mouseHasUserControl && !mouseTakeoverActive) {
      var rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        var nx = (e.clientX - rect.left) / rect.width;
        var ny = (e.clientY - rect.top) / rect.height;
        mouseTakeoverFrom.copy(mouseCoords);
        mouseTakeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
        mouseTakeoverStart = performance.now();
        mouseTakeoverActive = true;
        mouseHasUserControl = true;
        mouseIsAutoActive = false;
      }
    } else {
      updateFluidMouse(e.clientX, e.clientY);
      mouseHasUserControl = true;
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

    // Fluid mouse takeover
    if (mouseIsAutoActive && !mouseHasUserControl && !mouseTakeoverActive) {
      if (mouseIsHoverInside) {
        autoDriver.forceStop();
        var rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          var nx = (e.clientX - rect.left) / rect.width;
          var ny = (e.clientY - rect.top) / rect.height;
          mouseTakeoverFrom.copy(mouseCoords);
          mouseTakeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
          mouseTakeoverStart = performance.now();
          mouseTakeoverActive = true;
          mouseHasUserControl = true;
          mouseIsAutoActive = false;
        }
      }
    } else if (mouseIsHoverInside) {
      updateFluidMouse(e.clientX, e.clientY);
      mouseHasUserControl = true;
    } else {
      mouseIsHoverInside = false;
    }

    // 3D core takeover
    if (autoMode && !isDragging && mouseIsHoverInside) {
      takeoverActive = true;
      takeoverStart = performance.now();
      takeoverFromRX = targetRotX;
      takeoverFromRY = targetRotY;
      autoMode = false;
    }

    if (!takeoverActive) {
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
    mouseHasUserControl = false;
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

    cellScale = new THREE.Vector2();
    fboSize = new THREE.Vector2();
    boundarySpace = new THREE.Vector2();
    mouseCoords = new THREE.Vector2();
    mouseCoordsOld = new THREE.Vector2();
    mouseDiff = new THREE.Vector2();
    mouseTakeoverFrom = new THREE.Vector2();
    mouseTakeoverTo = new THREE.Vector2();
    bgVec4 = new THREE.Vector4(0, 0, 0, 0);
    autoDriver.init();

    resize();
    calcSimSize();
    createSimFBOs();
    createSimulation();
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