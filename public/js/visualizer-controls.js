(function () {
  var fieldMap = {
    cfgAudioSource: 'AudioSource',
    cfgAudioSyncOffset: 'AudioSyncOffset',
    cfgHideWhenSilent: 'HideWhenSilent',
    cfgSilentProcess: 'SilentProcess',
    cfgNormalizeVolume: 'NormalizeVolume',
    cfgTargetVolume: 'TargetVolume',
    cfgMaxGain: 'MaxGain',
    cfgDisplayMode: 'DisplayMode',
    cfgRenderMode: 'RenderMode',
    cfgChannel: 'Channel',
    cfgBarWidth: 'BarWidth',
    cfgBarGap: 'BarGap',
    cfgStepWidth: 'StepWidth',
    cfgStepGap: 'StepGap',
    cfgMinBarH: 'MinBarH',
    cfgWidth: 'Width',
    cfgHeight: 'Height',
    cfgLogScale: 'logScale',
    cfgMirrorFreq: 'mirrorFreqAxis',
    cfgRadialLayout: 'RadialLayout',
    cfgRadialInvert: 'RadialInvert',
    cfgDeadzone: 'Deadzone',
    cfgRadialArc: 'RadialArc',
    cfgRadialRot: 'RadialRotation',
    cfgRoundedCaps: 'RoundedCaps',
    cfgChannelMode: 'ChannelMode',
    cfgChannelSpacing: 'ChannelSpacing',
    cfgAutoFftSize: 'AutoFftSize',
    cfgEnableLargeFft: 'EnableLargeFft',
    cfgFftSize: 'FftSize',
    cfgWindow: 'WindowFunc',
    cfgSineExponent: 'SineExponent',
    cfgSmooth: 'TemporalSmoothing',
    cfgGravity: 'Gravity',
    cfgFastPeaks: 'FastPeaks',
    cfgMeterBufferMs: 'MeterBufferMs',
    cfgRmsMode: 'RmsMode',
    cfgMouseFollow: 'mouseFollow',
    cfgInterp: 'InterpMode',
    cfgFilterMode: 'FilterMode',
    cfgFilterRadius: 'FilterRadius',
    cfgCutoffLow: 'CutoffLow',
    cfgCutoffHigh: 'CutoffHigh',
    cfgFloor: 'Floor',
    cfgCeiling: 'Ceiling',
    cfgSlope: 'Slope',
    cfgRolloffQ: 'RolloffQ',
    cfgRolloffRate: 'RolloffRate',
    cfgPulseMode: 'PulseMode',
    cfgGradRatio: 'GradRatio',
    cfgRangeMid: 'RangeMiddle',
    cfgRangeCrest: 'RangeCrest',
    cfgColorBase: 'ColorBase',
    cfgColorMiddle: 'ColorMiddle',
    cfgColorCrest: 'ColorCrest'
  };

  var numericFields = [
    'cfgAudioSyncOffset', 'cfgTargetVolume', 'cfgMaxGain', 'cfgBarWidth', 'cfgBarGap', 'cfgStepWidth',
    'cfgStepGap', 'cfgMinBarH', 'cfgWidth', 'cfgHeight', 'cfgDeadzone', 'cfgRadialArc', 'cfgRadialRot',
    'cfgChannelSpacing', 'cfgSineExponent', 'cfgGravity', 'cfgMeterBufferMs', 'cfgFilterRadius',
    'cfgCutoffLow', 'cfgCutoffHigh', 'cfgFloor', 'cfgCeiling', 'cfgSlope', 'cfgRolloffQ',
    'cfgRolloffRate', 'cfgGradRatio', 'cfgRangeMid', 'cfgRangeCrest'
  ];

  var numericRanges = {
    cfgAudioSyncOffset: [-1000, 1000], cfgTargetVolume: [-60, 0], cfgMaxGain: [0, 45],
    cfgBarWidth: [1, 256], cfgBarGap: [0, 256], cfgStepWidth: [1, 256], cfgStepGap: [0, 256],
    cfgMinBarH: [0, 1080], cfgWidth: [32, 3840], cfgHeight: [32, 2160],
    cfgDeadzone: [0, 100], cfgRadialArc: [0, 360], cfgRadialRot: [0, 360],
    cfgChannelSpacing: [0, 2160], cfgSineExponent: [1, 16], cfgGravity: [0, 1],
    cfgMeterBufferMs: [16, 1000], cfgFilterRadius: [0, 32],
    cfgCutoffLow: [0, 24000], cfgCutoffHigh: [0, 24000],
    cfgFloor: [-120, 0], cfgCeiling: [-120, 0], cfgSlope: [0, 10],
    cfgRolloffQ: [0, 10], cfgRolloffRate: [0, 65],
    cfgGradRatio: [0, 4], cfgRangeMid: [-120, 0], cfgRangeCrest: [-120, 0]
  };
  var checkFields = [
    'cfgHideWhenSilent', 'cfgSilentProcess', 'cfgNormalizeVolume', 'cfgRoundedCaps', 'cfgLogScale',
    'cfgMirrorFreq', 'cfgRadialLayout', 'cfgRadialInvert', 'cfgAutoFftSize', 'cfgEnableLargeFft', 'cfgFastPeaks',
    'cfgRmsMode', 'cfgMouseFollow'
  ];
  var selectFields = [
    'cfgAudioSource', 'cfgDisplayMode', 'cfgRenderMode', 'cfgChannelMode', 'cfgChannel', 'cfgFftSize',
    'cfgWindow', 'cfgSmooth', 'cfgInterp', 'cfgFilterMode', 'cfgPulseMode'
  ];
  var colorPairs = [
    ['cfgColorBase', 'cfgColorBasePicker'],
    ['cfgColorMiddle', 'cfgColorMiddlePicker'],
    ['cfgColorCrest', 'cfgColorCrestPicker']
  ];

  var isAdmin = (window.__STAR_MUSIC_HOME__ || {}).userRole === 'admin';
  var FALLBACK_SETTINGS = {
    SettingsVersion: 2,
    DisplayMode: 'bars',
    RenderMode: 'solid',
    BarWidth: 16,
    BarGap: 7,
    Width: 800,
    Height: 225,
    logScale: true,
    mirrorFreqAxis: false,
    RadialLayout: false,
    Deadzone: 20,
    RadialArc: 360,
    RadialRotation: 0,
    RoundedCaps: false,
    MinBarH: 0,
    ChannelMode: 'mono',
    ChannelSpacing: 0,
    FftSize: 4096,
    WindowFunc: 'hann',
    TemporalSmoothing: 'exp_moving_avg',
    Gravity: 0.65,
    FastPeaks: false,
    MeterBufferMs: 150,
    RmsMode: true,
    mouseFollow: false,
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
    PulseMode: 'peak_magnitude',
    GradRatio: 0.75,
    RangeMiddle: -20,
    RangeCrest: -9,
    ColorBase: '#FFFFFFFF',
    ColorMiddle: '#FFFFFFFF',
    ColorCrest: '#FFFFFFFF',
    waveInstances: [
      { id: 1, name: '主音波', enabled: true, x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false }
    ]
  };
  var loadedDefaults = { ...FALLBACK_SETTINGS };

  function qs(id) {
    return document.getElementById(id);
  }

  function normalizeHex(hex) {
    var value = String(hex || '').trim().toUpperCase();
    if (!value) return '#FFFFFFFF';
    if (value[0] !== '#') value = '#' + value;
    if (value.length === 7) return value + 'FF';
    if (value.length === 9) return value;
    return '#FFFFFFFF';
  }

  function hexToPicker(hex) {
    return normalizeHex(hex).slice(0, 7);
  }

  function setTwinValue(id, value) {
    var slider = qs(id);
    var number = qs(id + 'N');
    if (slider) slider.value = value;
    if (number) number.value = value;
  }

  function setFieldValue(id, value) {
    var el = qs(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
      return;
    }
    el.value = value;
  }

  function applySettingsToUI(settings) {
    loadedDefaults = { ...loadedDefaults, ...settings };
    numericFields.forEach(function (id) {
      var key = fieldMap[id];
      setTwinValue(id, settings[key]);
    });
    checkFields.forEach(function (id) {
      var key = fieldMap[id];
      setFieldValue(id, !!settings[key]);
    });
    selectFields.forEach(function (id) {
      var key = fieldMap[id];
      setFieldValue(id, settings[key]);
    });
    colorPairs.forEach(function (pair) {
      var field = qs(pair[0]);
      var picker = qs(pair[1]);
      var key = fieldMap[pair[0]];
      var value = normalizeHex(settings[key]);
      if (field) field.value = value;
      if (picker) picker.value = hexToPicker(value);
    });
    updateVisibility();
  }

  function readAll() {
    var result = { SettingsVersion: 2 };

    numericFields.forEach(function (id) {
      var el = qs(id);
      if (!el) return;
      var val = Number(el.value);
      var range = numericRanges[id];
      if (range) val = Math.min(range[1], Math.max(range[0], val));
      result[fieldMap[id]] = val;
    });
    checkFields.forEach(function (id) {
      var el = qs(id);
      if (!el) return;
      result[fieldMap[id]] = !!el.checked;
    });
    selectFields.forEach(function (id) {
      var el = qs(id);
      if (!el) return;
      result[fieldMap[id]] = el.value;
    });
    colorPairs.forEach(function (pair) {
      var field = qs(pair[0]);
      if (!field) return;
      result[fieldMap[pair[0]]] = normalizeHex(field.value);
    });

    var eng = window.__waveformEngine;
    if (eng) {
      result.waveInstances = eng.getConfig().waveInstances || [];
    }

    return result;
  }

  function applyAll() {
    if (window.__waveformEngine) {
      window.__waveformEngine.applySettings(readAll());
    }
  }

  function toggleDisplay(id, show) {
    var el = qs(id);
    if (el) {
      el.style.display = show ? '' : 'none';
    }
  }

  function toggleFieldContainer(id, show) {
    var el = qs(id);
    if (!el) return;
    var target = el.closest('.viz-control') || el.closest('.viz-check-item') || el;
    target.style.display = show ? '' : 'none';
  }

  function updateVisibility() {
    var displayMode = qs('cfgDisplayMode').value;
    var renderMode = qs('cfgRenderMode').value;
    var channelMode = qs('cfgChannelMode').value;
    var radial = qs('cfgRadialLayout').checked;
    var normalize = qs('cfgNormalizeVolume').checked;
    var autoFft = qs('cfgAutoFftSize').checked;
    var windowMode = qs('cfgWindow').value;
    var filter = qs('cfgFilterMode').value;
    var smooth = qs('cfgSmooth').value;
    var isWaveform = displayMode === 'waveform';
    var isMeter = displayMode === 'level_meter' || displayMode === 'stepped_level_meter';
    var isBars = displayMode === 'bars' || displayMode === 'stepped_bars';
    var stepped = displayMode === 'stepped_bars' || displayMode === 'stepped_level_meter';
    var allowSpectrumControls = !isWaveform && !isMeter;

    toggleDisplay('grpStepWidth', stepped);
    toggleDisplay('grpStepGap', stepped);
    toggleDisplay('sectRadial', radial);
    toggleDisplay('grpRadialInv', radial);
    toggleDisplay('sectNormalize', normalize);
    toggleDisplay('grpFftSize', allowSpectrumControls && !autoFft);
    toggleDisplay('sectFilter', !isMeter && filter === 'gauss');
    toggleDisplay('grpGravity', allowSpectrumControls && smooth !== 'none');
    toggleDisplay('grpSineExponent', allowSpectrumControls && windowMode === 'power_of_sine');
    toggleDisplay('grpMeterBufferMs', isMeter);
    toggleDisplay('grpRmsMode', isMeter);
    toggleDisplay('grpChannelSelect', channelMode === 'single');
    toggleDisplay('grpPulseMode', renderMode === 'pulse');
    toggleDisplay('grpGradRatio', renderMode === 'gradient');
    toggleDisplay('grpRangeMiddle', renderMode === 'range');
    toggleDisplay('grpRangeCrest', renderMode === 'range');
    toggleDisplay('grpColorMiddle', renderMode === 'range');
    toggleDisplay('grpColorCrest', renderMode === 'gradient' || renderMode === 'range' || renderMode === 'pulse');
    toggleFieldContainer('cfgRoundedCaps', isBars);
    toggleFieldContainer('cfgBarWidth', isBars || isMeter);
    toggleFieldContainer('cfgBarGap', isBars || isMeter);
    toggleFieldContainer('cfgMinBarH', isBars || isMeter);
    toggleFieldContainer('cfgAutoFftSize', allowSpectrumControls);
    toggleFieldContainer('cfgEnableLargeFft', allowSpectrumControls && !autoFft);
    toggleFieldContainer('cfgWindow', allowSpectrumControls);
    toggleFieldContainer('cfgLogScale', allowSpectrumControls);
    toggleFieldContainer('cfgMirrorFreq', allowSpectrumControls);
    toggleFieldContainer('cfgSmooth', allowSpectrumControls);
    toggleFieldContainer('cfgFastPeaks', allowSpectrumControls && smooth !== 'none');
    toggleFieldContainer('cfgSlope', allowSpectrumControls);
    toggleFieldContainer('cfgRolloffQ', allowSpectrumControls);
    toggleFieldContainer('cfgRolloffRate', allowSpectrumControls);
    toggleFieldContainer('cfgFilterMode', !isMeter);
  }

  function bindNumericField(id) {
    var slider = qs(id);
    var number = qs(id + 'N');
    if (!slider || !number) return;

    slider.addEventListener('input', function () {
      number.value = slider.value;
      applyAll();
    });
    number.addEventListener('input', function () {
      slider.value = number.value;
      applyAll();
    });
    number.addEventListener('change', function () {
      slider.value = number.value;
      applyAll();
    });
  }

  function bindColorPair(fieldId, pickerId) {
    var field = qs(fieldId);
    var picker = qs(pickerId);
    if (!field || !picker) return;

    field.addEventListener('input', function () {
      picker.value = hexToPicker(field.value);
      applyAll();
    });
    picker.addEventListener('input', function () {
      var alpha = normalizeHex(field.value).slice(7, 9);
      field.value = picker.value.toUpperCase() + alpha;
      applyAll();
    });
  }

  function bindAdminActions() {
    if (!isAdmin) return;
    var badge = qs('vizAdminBadge');
    var btn = qs('vizSaveDefaults');
    if (badge) badge.style.display = '';
    if (btn) btn.style.display = '';
    if (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.textContent = '保存中...';
        try {
          var response = await fetch('/api/waveform/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readAll())
          });
          var result = await response.json();
          btn.textContent = result.ok ? '已保存' : '保存失败';
        } catch (err) {
          btn.textContent = '网络错误';
        }
        window.setTimeout(function () {
          btn.disabled = false;
          btn.textContent = '保存为默认';
        }, 1800);
      });
    }
  }

  function bindInstanceControls() {
    var listEl = qs('vizInstanceList');
    var propsEl = qs('vizInstanceProps');
    var addBtn = qs('vizAddInstance');
    var delBtn = qs('vizDelInstance');
    var flipHBtn = qs('vizFlipH');
    var flipVBtn = qs('vizFlipV');
    var centerBtn = qs('vizCenter');
    if (!listEl || !addBtn) return;

    var selectedId = null;
    var nextId = 1;

    function getInstances() {
      var eng = window.__waveformEngine;
      if (!eng) return [];
      return eng.getConfig().waveInstances || [];
    }

    function setInstances(arr) {
      var eng = window.__waveformEngine;
      if (!eng) return;
      var cfg = eng.getConfig();
      cfg.waveInstances = arr;
      applyAll();
    }

    function renderList() {
      var instances = getInstances();
      if (instances.length) nextId = Math.max.apply(null, instances.map(function (i) { return i.id; })) + 1;
      listEl.innerHTML = instances.map(function (inst) {
        var cls = 'viz-instance-chip' + (inst.id === selectedId ? ' active' : '');
        var enabledLabel = inst.enabled === false ? ' (隐藏)' : '';
        return '<span class="' + cls + '" data-id="' + inst.id + '">' + (inst.name || '实例') + enabledLabel + '</span>';
      }).join('');
      if (delBtn) delBtn.style.display = selectedId != null ? '' : 'none';
      if (propsEl) propsEl.style.display = selectedId != null ? '' : 'none';
      updateSelectedControls();
    }

    function selectInstance(id) {
      selectedId = id;
      renderList();
    }

    function updateSelectedControls() {
      var instances = getInstances();
      var inst = null;
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].id === selectedId) { inst = instances[i]; break; }
      }
      if (!inst) {
        if (qs('cfgInstX')) qs('cfgInstX').value = 0;
        if (qs('cfgInstXN')) qs('cfgInstXN').value = 0;
        if (qs('cfgInstY')) qs('cfgInstY').value = 0;
        if (qs('cfgInstYN')) qs('cfgInstYN').value = 0;
        if (qs('cfgInstScaleX')) qs('cfgInstScaleX').value = 100;
        if (qs('cfgInstScaleXN')) qs('cfgInstScaleXN').value = 100;
        if (qs('cfgInstScaleY')) qs('cfgInstScaleY').value = 100;
        if (qs('cfgInstScaleYN')) qs('cfgInstScaleYN').value = 100;
        return;
      }
      if (qs('cfgInstX')) qs('cfgInstX').value = inst.x || 0;
      if (qs('cfgInstXN')) qs('cfgInstXN').value = inst.x || 0;
      if (qs('cfgInstY')) qs('cfgInstY').value = inst.y || 0;
      if (qs('cfgInstYN')) qs('cfgInstYN').value = inst.y || 0;
      if (qs('cfgInstScaleX')) qs('cfgInstScaleX').value = inst.scaleX != null ? inst.scaleX : 100;
      if (qs('cfgInstScaleXN')) qs('cfgInstScaleXN').value = inst.scaleX != null ? inst.scaleX : 100;
      if (qs('cfgInstScaleY')) qs('cfgInstScaleY').value = inst.scaleY != null ? inst.scaleY : 100;
      if (qs('cfgInstScaleYN')) qs('cfgInstScaleYN').value = inst.scaleY != null ? inst.scaleY : 100;
    }

    function updateSelectedInstance(updates) {
      var instances = getInstances();
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].id === selectedId) {
          Object.keys(updates).forEach(function (k) { instances[i][k] = updates[k]; });
          setInstances(instances);
          return;
        }
      }
    }

    listEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.viz-instance-chip');
      if (!chip) return;
      var id = parseInt(chip.getAttribute('data-id'), 10);
      if (isNaN(id)) return;
      selectInstance(id === selectedId ? null : id);
    });

    addBtn.addEventListener('click', function () {
      var instances = getInstances();
      var id = nextId++;
      while (instances.some(function (i) { return i.id === id; })) id = nextId++;
      instances.push({ id: id, name: '音波 ' + id, enabled: true, x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false });
      setInstances(instances);
      selectInstance(id);
    });

    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (selectedId == null) return;
        var instances = getInstances().filter(function (i) { return i.id !== selectedId; });
        if (!instances.length) instances.push({ id: 1, name: '主音波', enabled: true, x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false });
        setInstances(instances);
        selectedId = null;
        renderList();
      });
    }

    if (flipHBtn) {
      flipHBtn.addEventListener('click', function () {
        var instances = getInstances();
        for (var i = 0; i < instances.length; i++) {
          if (instances[i].id === selectedId) { updateSelectedInstance({ flipH: !instances[i].flipH }); return; }
        }
      });
    }

    if (flipVBtn) {
      flipVBtn.addEventListener('click', function () {
        var instances = getInstances();
        for (var i = 0; i < instances.length; i++) {
          if (instances[i].id === selectedId) { updateSelectedInstance({ flipV: !instances[i].flipV }); return; }
        }
      });
    }

    if (centerBtn) {
      centerBtn.addEventListener('click', function () {
        updateSelectedInstance({ x: 0, y: 0, scaleX: 100, scaleY: 100, flipH: false, flipV: false });
        updateSelectedControls();
      });
    }

    var instNumericIds = ['cfgInstX', 'cfgInstY', 'cfgInstScaleX', 'cfgInstScaleY'];
    var instMap = { cfgInstX: 'x', cfgInstY: 'y', cfgInstScaleX: 'scaleX', cfgInstScaleY: 'scaleY' };
    instNumericIds.forEach(function (id) {
      var slider = qs(id);
      var number = qs(id + 'N');
      if (!slider || !number) return;
      var changeHandler = function () {
        if (selectedId == null) return;
        var val = Number(slider.value);
        number.value = val;
        var update = {}; update[instMap[id]] = val;
        updateSelectedInstance(update);
      };
      slider.addEventListener('input', function () { number.value = slider.value; });
      slider.addEventListener('change', changeHandler);
      number.addEventListener('input', function () { slider.value = number.value; });
      number.addEventListener('change', function () { slider.value = number.value; changeHandler(); });
    });

    window.__renderInstanceList = renderList;
    renderList();
  }

  function initBindings() {
    numericFields.forEach(bindNumericField);
    checkFields.forEach(function (id) {
      var el = qs(id);
      if (!el) return;
      el.addEventListener('change', function () {
        updateVisibility();
        applyAll();
      });
    });
    selectFields.forEach(function (id) {
      var el = qs(id);
      if (!el) return;
      el.addEventListener('change', function () {
        updateVisibility();
        applyAll();
      });
    });
    colorPairs.forEach(function (pair) {
      bindColorPair(pair[0], pair[1]);
    });
    bindAdminActions();
    bindSettingsToggle();
    bindInstanceControls();
    bindRefreshButtons();
  }

  function bindSettingsToggle() {
    var toggleBtn = qs('vizSettingsToggle');
    var settingsPanel = qs('vizSettings');
    if (!toggleBtn || !settingsPanel) return;

    var STORAGE_KEY = 'viz_settings_collapsed';

    function setCollapsed(collapsed) {
      if (collapsed) {
        settingsPanel.classList.add('viz-settings--collapsed');
        toggleBtn.setAttribute('title', '展开设置面板');
      } else {
        settingsPanel.classList.remove('viz-settings--collapsed');
        toggleBtn.setAttribute('title', '收起设置面板');
      }
    }

    var saved = localStorage.getItem(STORAGE_KEY);
    var isCollapsed = saved === 'true';
    setCollapsed(isCollapsed);

    toggleBtn.addEventListener('click', function () {
      isCollapsed = !isCollapsed;
      setCollapsed(isCollapsed);
      localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
    });
  }

  function bindRefreshButtons() {
    var btn1 = qs('vizRefreshBtn');
    var btn2 = qs('vizRefreshBtn2');

    function handleRefresh(btn) {
      if (!btn) return;
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.textContent = '刷新中...';

        var eng = window.__waveformEngine;
        if (eng) {
          eng.diagnose();
          await eng.refresh();
        }

        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = btn.classList.contains('viz-refresh-btn--large')
            ? '⟳ 刷新音波引擎'
            : '⟳ 刷新音波';
        }, 1200);
      });
    }

    handleRefresh(btn1);
    handleRefresh(btn2);
  }

  async function loadSettings() {
    try {
      var response = await fetch('/api/waveform/settings');
      var result = await response.json();
      if (result.ok && result.settings) {
        loadedDefaults = { ...FALLBACK_SETTINGS, ...result.settings };
        applySettingsToUI(loadedDefaults);
        if (result.settings.waveInstances && result.settings.waveInstances.length) {
          var eng = window.__waveformEngine;
          if (eng) eng.getConfig().waveInstances = result.settings.waveInstances;
        }
        applyAll();
        if (window.__renderInstanceList) window.__renderInstanceList();
        return;
      }
    } catch (err) {
      console.error('加载音波设置失败：', err);
    }

    loadedDefaults = { ...FALLBACK_SETTINGS };
    applySettingsToUI(loadedDefaults);
    applyAll();
  }

  initBindings();
  loadSettings();
})();
