const fs = require('fs');
const path = require('path');
const musicRepository = require('../repositories/musicRepository');
const collectRepository = require('../repositories/collectRepository');

function resolvePublicFilePath(assetPath) {
  const normalizedPath = String(assetPath || '').replace(/^\/+/, '');
  return path.join(__dirname, '..', 'public', normalizedPath);
}

function deleteIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getHomePageData(user) {
  const musicList = await musicRepository.getAllMusic();
  const collectRows = await collectRepository.getCollectedIdsByUser(user.id);
  const collectedIds = collectRows.map((item) => item.music_id);
  const featuredTrack = musicList[0] || null;

  return {
    user,
    musicList,
    collectedIds,
    featuredTrack,
    communityStats: {
      totalTracks: musicList.length,
      totalArtists: new Set(musicList.map((item) => item.singer).filter(Boolean)).size,
      totalPlays: musicList.reduce((sum, item) => sum + Number(item.play_count || 0), 0),
      collectedCount: collectedIds.length
    }
  };
}

async function getMyspaceData(user) {
  const collectList = await collectRepository.getCollectedMusicByUser(user.id);
  let uploadList = [];

  if (user.role === 'admin') {
    uploadList = await musicRepository.getUploadedByUser(user.id);
  }

  return {
    user,
    collectList,
    uploadList,
    collectCount: collectList.length,
    uploadCount: uploadList.length,
    profileMetrics: {
      favoriteArtists: new Set(collectList.map((item) => item.singer).filter(Boolean)).size,
      totalUploadPlays: uploadList.reduce((sum, item) => sum + Number(item.play_count || 0), 0),
      totalCollectedPlays: collectList.reduce((sum, item) => sum + Number(item.play_count || 0), 0)
    }
  };
}

async function uploadMusic(body, files, user) {
  const { song_name, singer } = body;
  const coverFile = files && files.cover && files.cover[0];
  const musicFile = files && files.music && files.music[0];

  if (!song_name || !singer) {
    throw new Error('歌曲信息不完整');
  }

  if (!coverFile || !musicFile) {
    throw new Error('上传文件不完整');
  }

  const coverPath = `/uploads/covers/${coverFile.filename}`;
  const musicPath = `/uploads/music/${musicFile.filename}`;

  await musicRepository.createMusic(song_name.trim(), singer.trim(), coverPath, musicPath, user.id);
}

async function collect(userId, musicId) {
  const normalizedUserId = toPositiveInt(userId);
  const normalizedMusicId = toPositiveInt(musicId);

  if (!normalizedUserId || !normalizedMusicId) {
    throw new Error('参数不合法');
  }

  const exists = await collectRepository.exists(normalizedUserId, normalizedMusicId);
  if (exists) {
    throw new Error('已经收藏过啦');
  }

  await collectRepository.create(normalizedUserId, normalizedMusicId);
}

async function uncollect(userId, musicId) {
  const normalizedUserId = toPositiveInt(userId);
  const normalizedMusicId = toPositiveInt(musicId);

  if (!normalizedUserId || !normalizedMusicId) {
    throw new Error('参数不合法');
  }

  await collectRepository.deleteOne(normalizedUserId, normalizedMusicId);
}

async function incrementPlayCount(musicId) {
  const normalizedMusicId = toPositiveInt(musicId);
  if (!normalizedMusicId) {
    throw new Error('参数不合法');
  }

  const song = await musicRepository.findById(normalizedMusicId);
  if (!song) {
    throw new Error('歌曲不存在');
  }

  const playCount = await musicRepository.incrementPlayCount(normalizedMusicId);
  return playCount;
}

async function deleteMusic(musicId) {
  const normalizedMusicId = toPositiveInt(musicId);
  if (!normalizedMusicId) {
    throw new Error('参数不合法');
  }

  const song = await musicRepository.findById(normalizedMusicId);
  if (!song) {
    throw new Error('歌曲不存在');
  }

  deleteIfExists(resolvePublicFilePath(song.cover_path));
  deleteIfExists(resolvePublicFilePath(song.mp3_path));

  await collectRepository.deleteByMusicId(normalizedMusicId);
  await musicRepository.deleteById(normalizedMusicId);
}

module.exports = {
  getHomePageData,
  getMyspaceData,
  uploadMusic,
  collect,
  uncollect,
  incrementPlayCount,
  deleteMusic
};
