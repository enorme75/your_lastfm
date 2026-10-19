const db = require("../db");
const { getArtistUrl, getAlbumUrl, getTrackUrl } = require("../utils/lastfmUrl");
const { getCachedArtistImage } = require("./artistImageCache");

db.function("norm", { deterministic: true }, value => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
});

function escapeLike(value) {
  return String(value || "").replace(/[\\%_]/g, match => `\\${match}`);
}

function likePattern(query) {
  return `%${escapeLike(
    String(query || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
  )}%`;
}

const searchArtists = db.prepare(`
  SELECT artist, COUNT(*) AS plays
  FROM scrobbles
  WHERE norm(artist) LIKE ? ESCAPE '\\'
  GROUP BY artist
  ORDER BY plays DESC
  LIMIT 10
`);

const searchAlbums = db.prepare(`
  SELECT
    artist,
    album,
    COUNT(*) AS plays,
    MAX(NULLIF(album_image, '')) AS album_image
  FROM scrobbles
  WHERE norm(album) LIKE ? ESCAPE '\\'
    AND album IS NOT NULL
    AND TRIM(album) != ''
  GROUP BY artist, album
  ORDER BY plays DESC
  LIMIT 10
`);

const searchTracks = db.prepare(`
  SELECT artist, track, COUNT(*) AS plays
  FROM scrobbles
  WHERE norm(track) LIKE ? ESCAPE '\\'
  GROUP BY artist, track
  ORDER BY plays DESC
  LIMIT 10
`);

function searchLibrary(query) {
  const pattern = likePattern(query);

  const artists = searchArtists.all(pattern).map(row => ({
    artist: row.artist,
    plays: row.plays,
    image: getCachedArtistImage(row.artist),
    url: getArtistUrl(row.artist)
  }));

  const albums = searchAlbums.all(pattern).map(row => ({
    artist: row.artist,
    album: row.album,
    plays: row.plays,
    image: row.album_image || null,
    url: getAlbumUrl(row.artist, row.album)
  }));

  const tracks = searchTracks.all(pattern).map(row => ({
    artist: row.artist,
    track: row.track,
    plays: row.plays,
    url: getTrackUrl(row.artist, row.track),
    artist_url: getArtistUrl(row.artist)
  }));

  return { query, artists, albums, tracks };
}

module.exports = { searchLibrary };
