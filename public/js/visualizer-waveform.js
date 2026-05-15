(function () {
  var audio = document.getElementById('audioPlayer');
  var canvas = document.getElementById('visualizerCanvas');
  var stage = document.getElementById('vizStage');
  if (!audio || !canvas || !stage) return;

  var ctx = canvas.getContext('2d');
  var audioCtx = null;
  var source = null;
  var splitter = null;
  var analyserLeft = null;
  var analyserRight = null;
  var animId = null;
  var running = false;
  var lastTick = 0;
  var historyFrames = [];
  var mouseX = 0, mouseY = 0, smoothMouseX = 0, smoothMouseY = 0;
  var smoothed = { left: null, right: null, meterLeft: null, meterRight: null };

  var cfg = {
    AudioSource: 'site_player',
    AudioSyncOffset: 0,
    HideWhenSilent: false,
    SilentProcess: false,
    NormalizeVolume: false,
    TargetVolume: -8,
    MaxGain: 30,
    DisplayMode: 'curve',
    RenderMode: 'solid',
    Width: 800,
    Height: 225,
    logScale: true,
    mirrorFreqAxis: false,
    BarWidth: 24,
    BarGap: 6,
    StepWidth: 8,
    StepGap: 4,
    MinBarH: 0,
    RoundedCaps: false,
    ChannelMode: 'mono',
    Channel: 0,
    ChannelSpacing: 0,
    AutoFftSize: false,
    EnableLargeFft: false,
    FftSize: 4096,
    WindowFunc: 'hann',
    SineExponent: 2,
    InterpMode: 'catmull_rom',
    FilterMode: 'none',
    FilterRadius: 1.5,
    CutoffLow: 30,
    CutoffHigh: 17500,
    Floor: -65,
    Ceiling: 0,
    Slope: 0,
    RolloffQ: 0,
    RolloffRate: 0,
    TemporalSmoothing: 'exp_moving_avg',
    Gravity: 0.65,
    FastPeaks: false,
    MeterBufferMs: 150,
    RmsMode: true,
    ColorBase: '#FFFFFFFF',
    ColorMiddle: '#FFFFFFFF',
    ColorCrest: '#FFFFFFFF',
    GradRatio: 0.75,
    PulseMode: 'peak_magnitude',
    RangeMiddle: -20,
    RangeCrest: -9,
    Deadzone: 20,
    RadialArc: 360,
    RadialRotation: 0,
    RadialLayout: false,
    RadialInvert: false,
    mouseFollow: false,
    cw: 900,
    ch: 400,
    waveInstances: [
      { id: 1, name: '主音波', enabled: true, x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false }
    ]
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeHex(hex) {
    var value = String(hex || '#FFFFFFFF').trim().toUpperCase();
    if (value.charAt(0) !== '#') value = '#' + value;
    if (value.length === 7) value += 'FF';
    if (value.length !== 9) value = '#FFFFFFFF';
    return value;
  }

  function hexParts(hex) {
    var value = normalizeHex(hex);
    return {
      r: parseInt(value.slice(1, 3), 16),
      g: parseInt(value.slice(3, 5), 16),
      b: parseInt(value.slice(5, 7), 16),
      a: parseInt(value.slice(7, 9), 16) / 255
    };
  }

  function rgbaFromParts(parts, alphaMul) {
    var alpha = clamp(parts.a * (alphaMul == null ? 1 : alphaMul), 0, 1);
    return 'rgba(' + parts.r + ',' + parts.g + ',' + parts.b + ',' + alpha.toFixed(3) + ')';
  }

  function blendColor(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
      a: a.a + (b.a - a.a) * t
    };
  }

  function catmullWeight(t) {
    var t2 = t * t;
    var t3 = t2 * t;
    return [
      -0.5 * t3 + t2 - 0.5 * t,
      1.5 * t3 - 2.5 * t2 + 1,
      -1.5 * t3 + 2 * t2 + 0.5 * t,
      0.5 * t3 - 0.5 * t2
    ];
  }

  function lanczos3(x) {
    if (Math.abs(x) < 1e-6) return 1;
    if (Math.abs(x) >= 3) return 0;
    var piX = Math.PI * x;
    return Math.sin(piX) * Math.sin(piX / 3) / (piX * piX) * 9;
  }

  function sampleInterpolated(arr, index) {
    var length = arr.length;
    if (!length) return 0;
    if (cfg.InterpMode === 'point') {
      return arr[clamp(Math.round(index), 0, length - 1)];
    }
    if (cfg.InterpMode === 'lanczos') {
      var sum = 0;
      var weight = 0;
      for (var i = Math.floor(index) - 2; i <= Math.floor(index) + 3; i += 1) {
        var safeIndex = clamp(i, 0, length - 1);
        var w = lanczos3(index - i);
        sum += arr[safeIndex] * w;
        weight += w;
      }
      return weight > 1e-6 ? sum / weight : arr[clamp(Math.floor(index), 0, length - 1)];
    }
    var base = Math.floor(index);
    var w4 = catmullWeight(index - base);
    var i0 = clamp(base - 1, 0, length - 1);
    var i1 = clamp(base, 0, length - 1);
    var i2 = clamp(base + 1, 0, length - 1);
    var i3 = clamp(base + 2, 0, length - 1);
    return arr[i0] * w4[0] + arr[i1] * w4[1] + arr[i2] * w4[2] + arr[i3] * w4[3];
  }

  function gaussianSmooth(values, radius) {
    if (!values || !values.length || radius <= 0) return values;
    var output = new Float32Array(values.length);
    var spread = Math.ceil(radius * 3);
    for (var i = 0; i < values.length; i += 1) {
      var sum = 0;
      var weightSum = 0;
      for (var j = Math.max(0, i - spread); j <= Math.min(values.length - 1, i + spread); j += 1) {
        var diff = (i - j) / radius;
        var weight = Math.exp(-0.5 * diff * diff);
        sum += values[j] * weight;
        weightSum += weight;
      }
      output[i] = weightSum > 0 ? sum / weightSum : values[i];
    }
    return output;
  }

  function getDisplayArrayLength(displayMode) {
    if (displayMode === 'curve' || displayMode === 'waveform') {
      return Math.max(48, Math.floor(cfg.cw * 0.65));
    }
    var barUnit = (displayMode === 'stepped_bars' || displayMode === 'stepped_level_meter')
      ? Math.max(1, cfg.StepWidth + cfg.StepGap)
      : Math.max(1, cfg.BarWidth + cfg.BarGap);
    return Math.max(12, Math.floor(cfg.cw / barUnit));
  }

  function resolveFftSize() {
    if (!cfg.AutoFftSize) {
      return clamp(cfg.FftSize, 256, cfg.EnableLargeFft ? 32768 : 8192);
    }
    var target = Math.max(256, cfg.cw * 4);
    var size = 256;
    while (size < target && size < (cfg.EnableLargeFft ? 32768 : 8192)) {
      size *= 2;
    }
    return size;
  }

  function updateAnalyserFftSize() {
    var nextSize = resolveFftSize();
    if (analyserLeft && analyserLeft.fftSize !== nextSize) analyserLeft.fftSize = nextSize;
    if (analyserRight && analyserRight.fftSize !== nextSize) analyserRight.fftSize = nextSize;
  }

  function resizeCanvas() {
    var ratio = window.devicePixelRatio || 1;
    var width = Math.max(320, Math.floor(stage.clientWidth - 8));
    var height = Math.max(160, Math.floor(stage.clientHeight - 8));
    cfg.cw = width;
    cfg.ch = height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    updateAnalyserFftSize();
  }

  function createAudioGraph() {
    if (audioCtx || !(window.AudioContext || window.webkitAudioContext)) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    splitter = audioCtx.createChannelSplitter(2);
    analyserLeft = audioCtx.createAnalyser();
    analyserRight = audioCtx.createAnalyser();
    analyserLeft.smoothingTimeConstant = 0;
    analyserRight.smoothingTimeConstant = 0;
    updateAnalyserFftSize();
    source.connect(splitter);
    splitter.connect(analyserLeft, 0);
    splitter.connect(analyserRight, 1);
    source.connect(audioCtx.destination);
  }

  function getFloatTimeData(analyser) {
    var length = analyser.fftSize;
    var output = new Float32Array(length);
    if (analyser.getFloatTimeDomainData) {
      analyser.getFloatTimeDomainData(output);
      return output;
    }
    var bytes = new Uint8Array(length);
    analyser.getByteTimeDomainData(bytes);
    for (var i = 0; i < length; i += 1) {
      output[i] = (bytes[i] - 128) / 128;
    }
    return output;
  }

  function getFrequencyData(analyser) {
    var output = new Float32Array(analyser.frequencyBinCount);
    if (analyser.getFloatFrequencyData) {
      analyser.getFloatFrequencyData(output);
      return output;
    }
    var bytes = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(bytes);
    for (var i = 0; i < bytes.length; i += 1) {
      output[i] = -100 + (bytes[i] / 255) * 100;
    }
    return output;
  }

  function computeRms(samples) {
    var sum = 0;
    for (var i = 0; i < samples.length; i += 1) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / Math.max(1, samples.length));
  }

  function computePeak(samples) {
    var peak = 0;
    for (var i = 0; i < samples.length; i += 1) {
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    return peak;
  }

  function applyNormalization(samples) {
    if (!cfg.NormalizeVolume) return samples;
    var rms = computeRms(samples);
    var currentDb = 20 * Math.log10(Math.max(rms, 1e-6));
    var gainDb = clamp(cfg.TargetVolume - currentDb, 0, cfg.MaxGain);
    if (gainDb <= 0) return samples;
    var factor = Math.pow(10, gainDb / 20);
    var output = new Float32Array(samples.length);
    for (var i = 0; i < samples.length; i += 1) {
      output[i] = clamp(samples[i] * factor, -1, 1);
    }
    return output;
  }

  function captureFrame(timestamp) {
    if (!analyserLeft || !analyserRight) return null;
    var rawLeftTime = getFloatTimeData(analyserLeft);
    var rawRightTime = getFloatTimeData(analyserRight);
    var leftTime = applyNormalization(rawLeftTime);
    var rightTime = applyNormalization(rawRightTime);
    var leftFreq = getFrequencyData(analyserLeft);
    var rightFreq = getFrequencyData(analyserRight);
    var monoRms = (computeRms(rawLeftTime) + computeRms(rawRightTime)) * 0.5;
    var maxDb = Math.max(
      Math.max.apply(null, leftFreq),
      Math.max.apply(null, rightFreq)
    );
    var frame = {
      t: timestamp,
      rawLeftTime: rawLeftTime,
      rawRightTime: rawRightTime,
      leftTime: leftTime,
      rightTime: rightTime,
      leftFreq: leftFreq,
      rightFreq: rightFreq,
      rms: monoRms,
      maxDb: maxDb
    };
    historyFrames.push(frame);
    var cutoff = timestamp - Math.max(2000, cfg.AudioSyncOffset + 250);
    while (historyFrames.length && historyFrames[0].t < cutoff) {
      historyFrames.shift();
    }
    return frame;
  }

  function getSyncedFrame(now) {
    if (!historyFrames.length) return null;
    var target = now - Math.max(0, cfg.AudioSyncOffset);
    for (var i = historyFrames.length - 1; i >= 0; i -= 1) {
      if (historyFrames[i].t <= target) return historyFrames[i];
    }
    return historyFrames[0];
  }

  function dbToUnit(db) {
    return clamp((db - cfg.Floor) / Math.max(1e-6, cfg.Ceiling - cfg.Floor), 0, 1);
  }

  function getFrequencyIndexMap(binCount, count, sampleRate, fftSize) {
    var low = Math.max(1, cfg.CutoffLow);
    var high = Math.max(low + 1, cfg.CutoffHigh);
    var output = new Float32Array(count);
    if (cfg.logScale) {
      var logLow = Math.log10(low);
      var logHigh = Math.log10(high);
      for (var i = 0; i < count; i += 1) {
        var ratio = count === 1 ? 0 : i / (count - 1);
        var hz = Math.pow(10, logLow + (logHigh - logLow) * ratio);
        output[i] = hz / sampleRate * fftSize;
      }
      return output;
    }
    for (var j = 0; j < count; j += 1) {
      var linearHz = low + (high - low) * (count === 1 ? 0 : j / (count - 1));
      output[j] = linearHz / sampleRate * fftSize;
    }
    return output;
  }

  function processFrequencyArray(freqDb, sampleRate, fftSize, count) {
    var map = getFrequencyIndexMap(freqDb.length, count, sampleRate, fftSize);
    var output = new Float32Array(count);
    for (var i = 0; i < count; i += 1) {
      var idx = clamp(map[i], 0, freqDb.length - 1);
      var value = dbToUnit(sampleInterpolated(freqDb, idx));
      if (cfg.WindowFunc === 'hamming') value = Math.pow(value, 1.04);
      if (cfg.WindowFunc === 'blackman') value = Math.pow(value, 1.08);
      if (cfg.WindowFunc === 'blackman_harris') value = Math.pow(value, 1.12);
      if (cfg.WindowFunc === 'power_of_sine') value = Math.pow(value, 1 / clamp(cfg.SineExponent, 0.1, 8));
      if (cfg.Slope !== 0) {
        value *= 1 + cfg.Slope * (i / Math.max(1, count - 1));
      }
      output[i] = value;
    }
    if (cfg.FilterMode === 'gauss' && cfg.FilterRadius > 0) {
      output = gaussianSmooth(output, cfg.FilterRadius);
    }
    if (cfg.RolloffRate > 0 && cfg.RolloffQ > 0) {
      for (var j = 0; j < output.length; j += 1) {
        var freq = cfg.CutoffLow + (cfg.CutoffHigh - cfg.CutoffLow) * (j / Math.max(1, output.length - 1));
        var gain = 1;
        if (freq < cfg.CutoffLow && cfg.CutoffLow > 0) {
          gain = Math.pow(10, (-cfg.RolloffRate * Math.log2(cfg.CutoffLow / Math.max(1, freq))) / 20);
        } else if (freq > cfg.CutoffHigh && cfg.CutoffHigh > 0) {
          gain = Math.pow(10, (-cfg.RolloffRate * Math.log2(freq / cfg.CutoffHigh)) / 20);
        }
        output[j] *= gain;
      }
    }
    return output;
  }

  function processWaveform(samples, count) {
    var output = new Float32Array(count);
    for (var i = 0; i < count; i += 1) {
      var idx = Math.floor(i / Math.max(1, count - 1) * (samples.length - 1));
      output[i] = samples[idx];
    }
    return output;
  }

  function smoothValues(key, values, dt) {
    if (cfg.TemporalSmoothing === 'none') {
      smoothed[key] = new Float32Array(values);
      return values;
    }
    if (!smoothed[key] || smoothed[key].length !== values.length) {
      smoothed[key] = new Float32Array(values);
      return values;
    }
    var previous = smoothed[key];
    var output = new Float32Array(values.length);
    var blend = cfg.TemporalSmoothing === 'tv_exp_moving_avg'
      ? 1 - Math.exp(-Math.max(0.01, cfg.Gravity) * dt * 8)
      : clamp(cfg.Gravity, 0.02, 0.95);
    for (var i = 0; i < values.length; i += 1) {
      if (cfg.FastPeaks && values[i] > previous[i]) {
        output[i] = values[i];
      } else {
        output[i] = previous[i] + (values[i] - previous[i]) * blend;
      }
    }
    smoothed[key] = output;
    return output;
  }

  function expandMirror(values) {
    if (!cfg.mirrorFreqAxis || values.length < 2) return values;
    var output = new Float32Array(values.length * 2 - 1);
    for (var i = 0; i < values.length; i += 1) output[i] = values[values.length - 1 - i];
    for (var j = 1; j < values.length; j += 1) output[values.length - 1 + j] = values[j];
    return output;
  }

  function getPulseFactor(values) {
    if (!values || !values.length) return 0.35;
    if (cfg.PulseMode === 'peak_frequency') {
      var peakIndex = 0;
      for (var i = 1; i < values.length; i += 1) {
        if (values[i] > values[peakIndex]) peakIndex = i;
      }
      return 0.35 + 0.65 * (peakIndex / Math.max(1, values.length - 1));
    }
    var maxValue = 0;
    for (var j = 0; j < values.length; j += 1) maxValue = Math.max(maxValue, values[j]);
    return 0.35 + 0.65 * maxValue;
  }

  function getColor(value, pulseFactor, vertical) {
    var base = hexParts(cfg.ColorBase);
    var middle = hexParts(cfg.ColorMiddle);
    var crest = hexParts(cfg.ColorCrest);
    if (cfg.RenderMode === 'gradient') {
      var gradient = vertical
        ? ctx.createLinearGradient(0, cfg.ch, 0, 0)
        : ctx.createLinearGradient(0, 0, cfg.cw, 0);
      gradient.addColorStop(0, rgbaFromParts(base));
      gradient.addColorStop(clamp(cfg.GradRatio, 0, 1), rgbaFromParts(base));
      gradient.addColorStop(1, rgbaFromParts(crest));
      return gradient;
    }
    if (cfg.RenderMode === 'range') {
      var db = cfg.Floor + value * (cfg.Ceiling - cfg.Floor);
      if (db >= cfg.RangeCrest) return rgbaFromParts(crest);
      if (db >= cfg.RangeMiddle) return rgbaFromParts(middle);
      return rgbaFromParts(base);
    }
    if (cfg.RenderMode === 'pulse') {
      return rgbaFromParts(blendColor(base, crest, clamp(pulseFactor, 0, 1)));
    }
    return rgbaFromParts(base);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, cfg.cw, cfg.ch);
  }

  function drawRoundedRect(x, y, w, h, radius, fill, stroke) {
    radius = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawLinearBars(values, originY, heightScale, options) {
    if (!values.length) return;
    var barWidth = options.barWidth;
    var barGap = options.barGap;
    var growDown = options.growDown;
    var pulse = getPulseFactor(values);
    var total = values.length * (barWidth + barGap) - barGap;
    var startX = (cfg.cw - total) / 2;
    for (var i = 0; i < values.length; i += 1) {
      var value = Math.max(cfg.MinBarH / 100, values[i]);
      var barHeight = value * heightScale;
      var x = startX + i * (barWidth + barGap);
      var y = growDown ? originY : originY - barHeight;
      if (cfg.RenderMode === 'line') {
        ctx.strokeStyle = getColor(value, pulse, true);
        ctx.lineWidth = Math.max(1, barWidth * 0.12);
        ctx.strokeRect(x, y, barWidth, barHeight);
      } else {
        ctx.fillStyle = getColor(value, pulse, true);
        if (cfg.RoundedCaps) {
          drawRoundedRect(x, y, barWidth, barHeight, Math.min(8, barWidth / 2), true, false);
        } else {
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    }
  }

  function drawLinearCurve(values, centerY, amplitude, waveformMode) {
    if (!values.length) return;
    var pulse = getPulseFactor(values);
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = cfg.RoundedCaps ? 'round' : 'butt';
    ctx.lineWidth = waveformMode ? 1.8 : 2.4;
    ctx.strokeStyle = getColor(0.8, pulse, true);
    for (var i = 0; i < values.length; i += 1) {
      var x = values.length === 1 ? cfg.cw / 2 : i / (values.length - 1) * cfg.cw;
      var offset = waveformMode ? values[i] * amplitude : values[i] * amplitude * -1;
      var y = centerY + offset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawLinearMeter(leftValue, rightValue, stepped) {
    var values = cfg.ChannelMode === 'stereo' ? [leftValue, rightValue] : [leftValue];
    var centerY = cfg.ch / 2;
    var halfGap = cfg.ChannelSpacing / 2;
    var segmentHeight = cfg.ChannelMode === 'stereo'
      ? (cfg.ch - cfg.ChannelSpacing) / 2
      : cfg.ch;
    var barWidth = stepped ? cfg.StepWidth : cfg.BarWidth;
    var barGap = stepped ? cfg.StepGap : cfg.BarGap;
    for (var channel = 0; channel < values.length; channel += 1) {
      var baseY, growDown;
      if (cfg.ChannelMode === 'stereo') {
        if (channel === 0) {
          baseY = centerY - halfGap;
          growDown = true;
        } else {
          baseY = centerY + halfGap;
          growDown = false;
        }
      } else {
        baseY = cfg.ch;
        growDown = false;
      }
      if (stepped) {
        var stepCount = Math.max(12, Math.floor(cfg.cw / Math.max(1, barWidth + barGap)));
        var array = new Float32Array(stepCount);
        array.fill(values[channel]);
        drawLinearBars(array, baseY, segmentHeight, { barWidth: barWidth, barGap: barGap, growDown: growDown });
      } else {
        ctx.fillStyle = getColor(values[channel], getPulseFactor(values), true);
        var barH = values[channel] * segmentHeight;
        var rectY = growDown ? baseY : baseY - barH;
        ctx.fillRect(0, rectY, cfg.cw, barH);
      }
    }
  }

  function radialGeometry(channelIndex, channelCount) {
    var centerX = cfg.cw / 2;
    var centerY = cfg.ch / 2;
    var minSize = Math.min(cfg.cw, cfg.ch);
    var baseRadius = minSize * clamp(cfg.Deadzone, 0, 100) / 200;
    var maxRadius = minSize * 0.46;
    if (channelCount === 1) {
      return { centerX: centerX, centerY: centerY, innerRadius: baseRadius, outerRadius: maxRadius };
    }
    var spacing = cfg.ChannelSpacing * 0.5;
    if (channelIndex === 0) {
      return { centerX: centerX, centerY: centerY, innerRadius: Math.max(8, baseRadius), outerRadius: Math.max(baseRadius + 18, maxRadius - spacing) };
    }
    return { centerX: centerX, centerY: centerY, innerRadius: Math.max(8, baseRadius - spacing * 0.3), outerRadius: Math.max(baseRadius + 28, maxRadius + spacing) };
  }

  function valueToAngle(index, count) {
    var totalArc = clamp(cfg.RadialArc, 1, 360) * Math.PI / 180;
    var rotation = (cfg.RadialRotation - 90) * Math.PI / 180;
    var ratio = count === 1 ? 0 : index / (count - 1);
    var direction = cfg.RadialInvert ? -1 : 1;
    return rotation + direction * (ratio * totalArc - totalArc / 2);
  }

  function drawRadialBars(values, geometry, stepped) {
    var barWidth = stepped ? cfg.StepWidth : cfg.BarWidth;
    var pulse = getPulseFactor(values);
    ctx.lineCap = cfg.RoundedCaps ? 'round' : 'butt';
    for (var i = 0; i < values.length; i += 1) {
      var angle = valueToAngle(i, values.length);
      var value = Math.max(cfg.MinBarH / 100, values[i]);
      var inner = geometry.innerRadius;
      var outer = inner + (geometry.outerRadius - geometry.innerRadius) * value;
      var x1 = geometry.centerX + Math.cos(angle) * inner;
      var y1 = geometry.centerY + Math.sin(angle) * inner;
      var x2 = geometry.centerX + Math.cos(angle) * outer;
      var y2 = geometry.centerY + Math.sin(angle) * outer;
      ctx.beginPath();
      ctx.strokeStyle = getColor(value, pulse, false);
      ctx.lineWidth = Math.max(1, barWidth);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  function drawRadialCurve(values, geometry, waveformMode) {
    if (!values.length) return;
    var pulse = getPulseFactor(values);
    var amplitude = geometry.outerRadius - geometry.innerRadius;
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = cfg.RoundedCaps ? 'round' : 'butt';
    ctx.lineWidth = waveformMode ? 1.8 : 2.4;
    ctx.strokeStyle = getColor(0.8, pulse, false);
    for (var i = 0; i < values.length; i += 1) {
      var angle = valueToAngle(i, values.length);
      var radius = waveformMode
        ? geometry.innerRadius + amplitude * (0.5 + values[i] * 0.5)
        : geometry.innerRadius + amplitude * values[i];
      var x = geometry.centerX + Math.cos(angle) * radius;
      var y = geometry.centerY + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    if (cfg.RadialArc >= 359) ctx.closePath();
    ctx.stroke();
  }

  function drawRadialMeter(values, geometry, stepped) {
    var meterValues = new Float32Array(stepped ? 48 : 2);
    if (stepped) meterValues.fill(values[0]);
    else meterValues[0] = values[0];
    drawRadialBars(meterValues, geometry, stepped);
  }

  function drawScene(scene) {
    clearCanvas();
    if (!scene) return;

    if (cfg.HideWhenSilent && scene.rms < 1e-6) return;

    var instances = cfg.waveInstances;
    if (!instances || !instances.length) {
      cfg.waveInstances = [{ id: 1, name: '主音波', enabled: true, x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false }];
      instances = cfg.waveInstances;
    }

    for (var instIdx = 0; instIdx < instances.length; instIdx++) {
      var inst = instances[instIdx];
      if (inst.enabled === false) continue;

      ctx.save();
      var sx = inst.scaleX / 100;
      var sy = inst.scaleY / 100;
      if (inst.flipH) sx = -sx;
      if (inst.flipV) sy = -sy;
      ctx.translate(cfg.cw / 2 + (inst.x || 0), cfg.ch / 2 + (inst.y || 0));
      if (cfg.mouseFollow) {
        ctx.translate(smoothMouseX * cfg.cw * 0.12, smoothMouseY * cfg.ch * 0.12);
      }
      ctx.scale(sx, sy);
      ctx.translate(-cfg.cw / 2, -cfg.ch / 2);

    var leftSpectrum = expandMirror(scene.leftSpectrum);
    var rightSpectrum = expandMirror(scene.rightSpectrum);
    var leftWave = scene.leftWave;
    var rightWave = scene.rightWave;
    var stepped = cfg.DisplayMode === 'stepped_bars' || cfg.DisplayMode === 'stepped_level_meter';

    if (cfg.DisplayMode === 'level_meter' || cfg.DisplayMode === 'stepped_level_meter') {
      if (cfg.RadialLayout) {
        var meterValues = cfg.ChannelMode === 'stereo'
          ? [scene.leftMeter, scene.rightMeter]
          : [scene.leftMeter];
        for (var m = 0; m < meterValues.length; m += 1) {
          drawRadialMeter([meterValues[m]], radialGeometry(m, meterValues.length), stepped);
        }
      } else {
        drawLinearMeter(scene.leftMeter, scene.rightMeter, stepped);
      }
      ctx.restore();
      continue;
    }

    if (cfg.DisplayMode === 'waveform') {
      if (cfg.RadialLayout) {
        if (cfg.ChannelMode === 'stereo') {
          drawRadialCurve(leftWave, radialGeometry(0, 2), true);
          drawRadialCurve(rightWave, radialGeometry(1, 2), true);
        } else {
          drawRadialCurve(leftWave, radialGeometry(0, 1), true);
        }
      } else {
        if (cfg.ChannelMode === 'stereo') {
          drawLinearCurve(leftWave, cfg.ch * 0.32, cfg.ch * 0.22, true);
          drawLinearCurve(rightWave, cfg.ch * 0.68, cfg.ch * 0.22, true);
        } else {
          drawLinearCurve(leftWave, cfg.ch * 0.5, cfg.ch * 0.34, true);
        }
      }
      ctx.restore();
      continue;
    }

    if (cfg.DisplayMode === 'curve') {
      if (cfg.RadialLayout) {
        if (cfg.ChannelMode === 'stereo') {
          drawRadialCurve(leftSpectrum, radialGeometry(0, 2), false);
          drawRadialCurve(rightSpectrum, radialGeometry(1, 2), false);
        } else {
          drawRadialCurve(leftSpectrum, radialGeometry(0, 1), false);
        }
      } else {
        if (cfg.ChannelMode === 'stereo') {
          drawLinearCurve(leftSpectrum, cfg.ch * 0.44, cfg.ch * 0.3, false);
          drawLinearCurve(rightSpectrum, cfg.ch * 0.94, -cfg.ch * 0.3, false);
        } else {
          drawLinearCurve(leftSpectrum, cfg.ch, cfg.ch * 0.94, false);
        }
      }
      ctx.restore();
      continue;
    }

    var barWidth = stepped ? cfg.StepWidth : cfg.BarWidth;
    var barGap = stepped ? cfg.StepGap : cfg.BarGap;
    if (cfg.RadialLayout) {
      if (cfg.ChannelMode === 'stereo') {
        drawRadialBars(leftSpectrum, radialGeometry(0, 2), stepped);
        drawRadialBars(rightSpectrum, radialGeometry(1, 2), stepped);
      } else {
        drawRadialBars(leftSpectrum, radialGeometry(0, 1), stepped);
      }
      ctx.restore();
      continue;
    }

    if (cfg.ChannelMode === 'stereo') {
      var half = (cfg.ch - cfg.ChannelSpacing) / 2;
      var halfGap = cfg.ChannelSpacing / 2;
      var centerY = cfg.ch / 2;
      drawLinearBars(leftSpectrum, centerY - halfGap, half, { barWidth: barWidth, barGap: barGap, growDown: true });
      drawLinearBars(rightSpectrum, centerY + halfGap, half, { barWidth: barWidth, barGap: barGap, growDown: false });
    } else {
      drawLinearBars(leftSpectrum, cfg.ch, cfg.ch, { barWidth: barWidth, barGap: barGap });
    }

      ctx.restore();
    }
  }

  function buildScene(frame, dt) {
    if (!frame) return null;
    var isWaveform = cfg.DisplayMode === 'waveform';
    var isMeter = cfg.DisplayMode === 'level_meter' || cfg.DisplayMode === 'stepped_level_meter';
    var fftSize = analyserLeft.fftSize;
    var sampleRate = audioCtx.sampleRate;
    var count = getDisplayArrayLength(cfg.DisplayMode);
    var leftSpectrum = processFrequencyArray(frame.leftFreq, sampleRate, fftSize, count);
    var rightSpectrum = processFrequencyArray(frame.rightFreq, sampleRate, fftSize, count);
    var leftWave = processWaveform(frame.leftTime, count);
    var rightWave = processWaveform(frame.rightTime, count);
    var leftMeterSource = cfg.RmsMode ? computeRms(frame.rawLeftTime) : computePeak(frame.rawLeftTime);
    var rightMeterSource = cfg.RmsMode ? computeRms(frame.rawRightTime) : computePeak(frame.rawRightTime);
    var leftMeter = dbToUnit(20 * Math.log10(Math.max(leftMeterSource, 1e-6)));
    var rightMeter = dbToUnit(20 * Math.log10(Math.max(rightMeterSource, 1e-6)));

    if (isMeter && cfg.MeterBufferMs > 0) {
      var meterStart = frame.t - cfg.MeterBufferMs;
      for (var h = historyFrames.length - 1; h >= 0; h -= 1) {
        var meterFrame = historyFrames[h];
        if (meterFrame.t < meterStart) break;
        var holdLeft = cfg.RmsMode ? computeRms(meterFrame.rawLeftTime) : computePeak(meterFrame.rawLeftTime);
        var holdRight = cfg.RmsMode ? computeRms(meterFrame.rawRightTime) : computePeak(meterFrame.rawRightTime);
        leftMeter = Math.max(leftMeter, dbToUnit(20 * Math.log10(Math.max(holdLeft, 1e-6))));
        rightMeter = Math.max(rightMeter, dbToUnit(20 * Math.log10(Math.max(holdRight, 1e-6))));
      }
    }

    if (!isWaveform && !isMeter) {
      leftSpectrum = smoothValues('left', leftSpectrum, dt);
      rightSpectrum = smoothValues('right', rightSpectrum, dt);
      leftMeter = smoothValues('meterLeft', new Float32Array([leftMeter]), dt)[0];
      rightMeter = smoothValues('meterRight', new Float32Array([rightMeter]), dt)[0];
    }

    if (cfg.ChannelMode === 'mono') {
      var monoSpectrum = new Float32Array(leftSpectrum.length);
      var monoWave = new Float32Array(leftWave.length);
      for (var i = 0; i < monoSpectrum.length; i += 1) {
        monoSpectrum[i] = (leftSpectrum[i] + rightSpectrum[i]) * 0.5;
      }
      for (var j = 0; j < monoWave.length; j += 1) {
        monoWave[j] = (leftWave[j] + rightWave[j]) * 0.5;
      }
      leftSpectrum = monoSpectrum;
      rightSpectrum = monoSpectrum;
      leftWave = monoWave;
      rightWave = monoWave;
      leftMeter = (leftMeter + rightMeter) * 0.5;
      rightMeter = leftMeter;
    } else if (cfg.ChannelMode === 'single') {
      if (cfg.Channel === 1) {
        leftSpectrum = rightSpectrum;
        rightSpectrum = rightSpectrum;
        leftWave = rightWave;
        rightWave = rightWave;
        leftMeter = rightMeter;
      } else {
        rightSpectrum = leftSpectrum;
        rightWave = leftWave;
        rightMeter = leftMeter;
      }
    }

    return {
      leftSpectrum: leftSpectrum,
      rightSpectrum: rightSpectrum,
      leftWave: leftWave,
      rightWave: rightWave,
      leftMeter: leftMeter,
      rightMeter: rightMeter,
      rms: frame.rms,
      maxDb: frame.maxDb
    };
  }

  function tryResumeCtx() {
    if (!audioCtx || audioCtx.state !== 'suspended') return;
    audioCtx.resume().catch(function () {});
  }

  function tick(now) {
    if (!running) return;
    animId = requestAnimationFrame(tick);
    if (!audioCtx || !analyserLeft) return;
    if (audioCtx.state === 'suspended') {
      tryResumeCtx();
      return;
    }
    var dt = lastTick ? Math.min(0.12, (now - lastTick) / 1000) : 0.016;
    lastTick = now;

    var smoothFactor = 0.08;
    smoothMouseX += (mouseX - smoothMouseX) * smoothFactor;
    smoothMouseY += (mouseY - smoothMouseY) * smoothFactor;

    captureFrame(now);
    var scene = buildScene(getSyncedFrame(now), dt);
    drawScene(scene);
  }

  function start() {
    try {
      resizeCanvas();
      createAudioGraph();
      tryResumeCtx();
    } catch (err) {
      console.error('初始化音波引擎失败：', err);
    }
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    running = true;
    lastTick = 0;
    animId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function applySettings(settings) {
    var numericKeys = [
      'AudioSyncOffset', 'TargetVolume', 'MaxGain', 'Width', 'Height', 'BarWidth', 'BarGap', 'StepWidth',
      'StepGap', 'MinBarH', 'Channel', 'ChannelSpacing', 'FftSize', 'SineExponent', 'MeterBufferMs',
      'FilterRadius', 'CutoffLow', 'CutoffHigh', 'Floor', 'Ceiling', 'Slope', 'RolloffQ',
      'RolloffRate', 'Gravity', 'GradRatio', 'RangeMiddle', 'RangeCrest', 'Deadzone', 'RadialArc',
      'RadialRotation'
    ];
    var boolKeys = [
      'HideWhenSilent', 'SilentProcess', 'NormalizeVolume', 'RoundedCaps', 'logScale', 'mirrorFreqAxis',
      'RadialLayout', 'RadialInvert', 'AutoFftSize', 'EnableLargeFft', 'FastPeaks', 'RmsMode', 'mouseFollow'
    ];
    var stringKeys = [
      'AudioSource', 'DisplayMode', 'RenderMode', 'ChannelMode', 'WindowFunc', 'InterpMode',
      'FilterMode', 'TemporalSmoothing', 'PulseMode', 'ColorBase', 'ColorMiddle', 'ColorCrest'
    ];

    numericKeys.forEach(function (key) {
      if (settings[key] != null) cfg[key] = Number(settings[key]);
    });
    boolKeys.forEach(function (key) {
      if (settings[key] != null) cfg[key] = !!settings[key];
    });
    stringKeys.forEach(function (key) {
      if (settings[key] != null) cfg[key] = settings[key];
    });

    historyFrames = [];
    smoothed = { left: null, right: null, meterLeft: null, meterRight: null, waveLeft: null, waveRight: null };
    if (settings.waveInstances != null && Array.isArray(settings.waveInstances) && settings.waveInstances.length) {
      cfg.waveInstances = settings.waveInstances.map(function (inst) {
        return {
          id: inst.id,
          name: inst.name || '音波 ' + inst.id,
          enabled: inst.enabled !== false,
          x: Number(inst.x) || 0,
          y: Number(inst.y) || 0,
          scaleX: inst.scaleX != null ? Number(inst.scaleX) : 100,
          scaleY: inst.scaleY != null ? Number(inst.scaleY) : 100,
          flipH: !!inst.flipH,
          flipV: !!inst.flipV
        };
      });
    }
    updateAnalyserFftSize();
    resizeCanvas();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  if (stage) {
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    });
    document.addEventListener('mouseleave', function () {
      mouseX = 0;
      mouseY = 0;
    });
  }

  async function refresh() {
    stop();
    historyFrames = [];
    smoothed = { left: null, right: null, meterLeft: null, meterRight: null, waveLeft: null, waveRight: null };
    resizeCanvas();

    if (!audioCtx) {
      createAudioGraph();
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (e) {
        console.warn('[Visualizer] AudioContext resume failed:', e.message);
      }
    }

    if (!audio.paused) {
      await start();
    }
  }

  function diagnose() {
    var info = {
      audioElement: !!audio,
      audioPaused: audio ? audio.paused : null,
      audioSrc: audio ? (audio.src || '(empty)') : 'null',
      canvasExists: !!canvas,
      canvasSize: canvas ? (canvas.width + 'x' + canvas.height) : 'null',
      canvasStyleSize: canvas ? (canvas.style.width + ' x ' + canvas.style.height) : 'null',
      stageExists: !!stage,
      stageSize: stage ? (stage.clientWidth + 'x' + stage.clientHeight) : 'null',
      audioCtxExists: !!audioCtx,
      audioCtxState: audioCtx ? audioCtx.state : 'null',
      analyserLeft: !!analyserLeft,
      analyserRight: !!analyserRight,
      analyserLeftFftSize: analyserLeft ? analyserLeft.fftSize : 0,
      running: running,
      historyFrames: historyFrames.length,
      cfgDisplayMode: cfg.DisplayMode,
      cfgRenderMode: cfg.RenderMode,
      cfgChannelMode: cfg.ChannelMode,
      cfgColorBase: cfg.ColorBase,
      cfgWidth: cfg.cw,
      cfgHeight: cfg.ch
    };
    console.log('[Visualizer] DIAGNOSTICS:', JSON.stringify(info, null, 2));
    return info;
  }

  window.__waveformEngine = {
    start: start,
    stop: stop,
    refresh: refresh,
    diagnose: diagnose,
    applySettings: applySettings,
    getConfig: function () { return cfg; },
    resize: resizeCanvas,
    getCtx: function () { return audioCtx; }
  };

  audio.addEventListener('play', start);
  audio.addEventListener('playing', start);
  audio.addEventListener('pause', function () {
    stop();
  });

  window.addEventListener('pageswitch', function (event) {
    if (!event.detail || !event.detail.page) return;
    if (event.detail.page === 'visualizer' && !audio.paused) {
      start();
    }
  });

  audio.addEventListener('emptied', function () {
    stop();
    historyFrames = [];
    smoothed = { left: null, right: null, meterLeft: null, meterRight: null };
  });

  audio.addEventListener('error', function () {
    stop();
  });

  if (!audio.paused) {
    start();
  }
})();
