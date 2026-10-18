const db = require("../db");
const { getTrackUrl, getAlbumUrl, getArtistUrl } = require("../utils/lastfmUrl");
const { ensureAlbumCover } = require("./albumCoverCache");
const { ensureAlbumYear } = require("./albumYearCache");
const { withDashboardCache } = require("./dashboardCache");

const getAlbumStats = db.prepare(`
  SELECT
    COUNT(*) AS plays,
    MIN(played_at) AS firstPlay,
    MAX(played_at) AS lastPlay,
    COUNT(DISTINCT track) AS uniqueTracks,
    MAX(NULLIF(album_image, '')) AS album_image
  FROM scrobbles
  WHERE artist = ? COLLATE NOCASE AND album = ? COLLATE NOCASE
`);

const getAlbumTracks = db.prepare(`
  SELECT
    track,
    COUNT(*) AS plays,
    MAX(played_at) AS lastPlay
  FROM scrobbles
  WHERE artist = ? COLLATE NOCASE AND album = ? COLLATE NOCASE
  GROUP BY track
  ORDER BY plays DESC
`);

async function buildAlbumPage(artist, album) {
  const stats = getAlbumStats.get(artist, album);
  if (!stats || stats.plays === 0) return null;

  const tracks = getAlbumTracks.all(artist, album);
  const [cover, year] = await Promise.all([
    ensureAlbumCover(artist, album).catch(() => null),
    ensureAlbumYear(artist, album)
  ]);

  return {
    artist,
    album,
    plays: stats.plays,
    firstPlay: stats.firstPlay,
    lastPlay: stats.lastPlay,
    uniqueTracks: stats.uniqueTracks,
    image: cover || stats.album_image || null,
    year: year || null,
    url: getAlbumUrl(artist, album),
    artistUrl: getArtistUrl(artist),
    tracks: tracks.map(row => ({
      track: row.track,
      plays: row.plays,
      lastPlay: row.lastPlay,
      url: getTrackUrl(artist, row.track)
    }))
  };
}

async function getAlbumPage(artistName, albumName) {
  const artist = String(artistName || "").trim();
  const album = String(albumName || "").trim();
  if (!artist || !album) return null;

  const cacheKey = `album:${artist.toLocaleLowerCase()}\u0000${album.toLocaleLowerCase()}`;
  const result = await withDashboardCache(cacheKey, () => buildAlbumPage(artist, album));

  const data = result?.data || null;

  return {
    ...data,
    cache: result?.cache
  };
}

module.exports = { getAlbumPage };
