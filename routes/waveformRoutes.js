﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const DEFAULT_SETTINGS = {
  SettingsVersion: 2,
  AudioSource: 'site_player',
  AudioSyncOffset: 0,
  HideWhenSilent: false,
  SilentProcess: false,
  NormalizeVolume: false,
  TargetVolume: -8,
  MaxGain: 30,
  DisplayMode: 'curve',
  RenderMode: 'solid',
  ColorBase: '#FFFFFFFF',
  ColorCrest: '#FFFFFFFF',
  ColorMiddle: '#FFFFFFFF',
  Width: 800,
  Height: 225,
  logScale: true,
  mirrorFreqAxis: false,
  RadialLayout: false,
  RadialInvert: false,
  Deadzone: 20,
  RadialArc: 360,
  RadialRotation: 0,
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
  PulseMode: 'peak_magnitude',
  RangeMiddle: -20,
  RangeCrest: -9,
  GradRatio: 0.75
};

function getDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

router.get('/waveform/settings', requireLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT settings FROM waveform_defaults WHERE id = 1');
    if (rows.length) {
      const stored = typeof rows[0].settings === 'string'
        ? JSON.parse(rows[0].settings)
        : rows[0].settings;

      if (stored && stored.SettingsVersion === DEFAULT_SETTINGS.SettingsVersion) {
        return res.json({ ok: true, settings: { ...getDefaults(), ...stored } });
      }
    }

    return res.json({ ok: true, settings: getDefaults() });
  } catch (err) {
    console.error('读取音波设置失败：', err);
    res.json({ ok: true, settings: getDefaults() });
  }
});

router.put('/waveform/settings', requireLogin, requireAdmin, async (req, res) => {
  try {
    var allowedKeys = Object.keys(DEFAULT_SETTINGS);
    var clean = {};
    for (var i = 0; i < allowedKeys.length; i++) {
      var k = allowedKeys[i];
      if (req.body && req.body[k] != null) clean[k] = req.body[k];
    }
    var settings = { ...getDefaults(), ...clean, SettingsVersion: DEFAULT_SETTINGS.SettingsVersion };
    await db.query(
      'INSERT INTO waveform_defaults (id, settings) VALUES (1, ?) ON DUPLICATE KEY UPDATE settings = ?',
      [JSON.stringify(settings), JSON.stringify(settings)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('保存音波设置失败：', err);
    res.status(500).json({ ok: false, message: '保存失败' });
  }
});

module.exports = router;
