const db = require("../db");
const { mapWithConcurrency } = require("../utils/mapWithConcurrency");
const { getAlbumUrl, getTrackUrl } = require("../utils/lastfmUrl");
const { ensureArtistImage } = require("./artistImageCache");
const { ensureAlbumCover } = require("./albumCoverCache");
const { ensureArtistInfo } = require("./artistInfoCache");
const { ensureAlbumYear } = require("./albumYearCache");
const { withDashboardCache } = require("./dashboardCache");

const EXTERNAL_REQUEST_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.EXTERNAL_REQUEST_CONCURRENCY || "4", 10) || 4
);

const getArtistStats = db.prepare(`
  SELECT
    COUNT(*) AS plays,
    MIN(played_at) AS firstPlay,
    MAX(played_at) AS lastPlay,
    COUNT(DISTINCT track) AS uniqueTracks,
    COUNT(DISTINCT NULLIF(TRIM(album), '')) AS uniqueAlbums
  FROM scrobbles
  WHERE artist = ? COLLATE NOCASE
`);

const getArtistTopTracks = db.prepare(`
  SELECT
    track,
    COUNT(*) AS plays
  FROM scrobbles
  WHERE artist = ? COLLATE NOCASE
  GROUP BY track
  ORDER BY plays DESC
  LIMIT 10
`);

const getArtistAlbums = db.prepare(`
  SELECT
    album,
    MAX(NULLIF(album_image, '')) AS album_image,
    COUNT(*) AS plays,
    MIN(played_at) AS firstPlay
  FROM scrobbles
  WHERE artist = ? COLLATE NOCASE
    AND album IS NOT NULL
    AND TRIM(album) != ''
  GROUP BY album
  ORDER BY plays DESC
  LIMIT 24
`);

async function buildArtistPage(artist, lang) {
  const stats = getArtistStats.get(artist);
  if (!stats || stats.plays === 0) return null;

  const topTracks = getArtistTopTracks.all(artist);
  const albums = getArtistAlbums.all(artist);

  const [image, info, enrichedAlbums] = await Promise.all([
    ensureArtistImage(artist).catch(() => null),
    ensureArtistInfo(artist, lang).catch(() => null),
    mapWithConcurrency(albums, EXTERNAL_REQUEST_CONCURRENCY, async row => {
      const [cover, year] = await Promise.all([
        ensureAlbumCover(artist, row.album).catch(() => null),
        ensureAlbumYear(artist, row.album)
      ]);

      return {
        album: row.album,
        plays: row.plays,
        firstPlay: row.firstPlay,
        image: cover || row.album_image || null,
        year
      };
    })
  ]);

  return {
    artist,
    plays: stats.plays,
    firstPlay: stats.firstPlay,
    lastPlay: stats.lastPlay,
    uniqueTracks: stats.uniqueTracks,
    uniqueAlbums: stats.uniqueAlbums,
    image: image || info?.image || null,
    bio: info?.bio || null,
    lastfmUrl: info?.lastfmUrl || null,
    topTracks: topTracks.map(row => ({
      track: row.track,
      plays: row.plays,
      url: getTrackUrl(artist, row.track)
    })),
    albums: enrichedAlbums.map(row => ({
      ...row,
      url: getAlbumUrl(artist, row.album)
    }))
  };
}

async function getArtistPage(name, { lang = "en" } = {}) {
  const artist = String(name || "").trim();
  if (!artist) return null;

  const cacheKey = `artist:${artist.toLocaleLowerCase()}:lang:${lang}`;
  const result = await withDashboardCache(cacheKey, () => buildArtistPage(artist, lang));

  const data = result?.data || null;

  return {
    ...data,
    cache: result?.cache
  };
}

module.exports = { getArtistPage };
