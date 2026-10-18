const axios = require("axios");
const db = require("../db");
const { fetchWithRetry } = require("../utils/fetchRetry");

const MB_URL = "https://musicbrainz.org/ws/2/release-group";
const MB_USER_AGENT = "your_lastfm/1.0 (personal self-hosted fork)";
const REQUEST_TIMEOUT = Number(process.env.IMAGE_REQUEST_TIMEOUT_MS || 10000);
const YEAR_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = Math.max(
  60000,
  Number(process.env.METADATA_FAILURE_CACHE_MS) || 10 * 60 * 1000
);

const getCachedYear = db.prepare(`
  SELECT release_year, updated_at
  FROM album_info
  WHERE artist = ? COLLATE NOCASE AND album = ? COLLATE NOCASE
`);

const saveCachedYear = db.prepare(`
  INSERT INTO album_info (artist, album, release_year, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(artist, album) DO UPDATE SET
    release_year = excluded.release_year,
    updated_at = excluded.updated_at
`);

const inFlight = new Map();

async function searchReleaseGroup(artist, album, albumTypeOnly) {
  const query = albumTypeOnly
    ? `artist:"${artist}" AND releasegroup:"${album}" AND primarytype:album`
    : `artist:"${artist}" AND releasegroup:"${album}"`;

  const { data } = await fetchWithRetry(() =>
    axios.get(MB_URL, {
      timeout: REQUEST_TIMEOUT,
      headers: { "User-Agent": MB_USER_AGENT },
      params: { query, fmt: "json", limit: 5 }
    }),
    2,
    1000
  );

  return Array.isArray(data?.["release-groups"]) ? data["release-groups"] : [];
}

function pickReleaseYear(groups) {
  const album = groups.find(group => group?.["primary-type"] === "Album");
  const group = album || groups[0];
  const year = Number.parseInt(String(group?.["first-release-date"] || "").slice(0, 4), 10);

  return Number.isInteger(year) && year > 1900 ? year : null;
}

async function fetchAlbumYear(artist, album) {
  const typed = await searchReleaseGroup(artist, album, true);
  const year = pickReleaseYear(typed);
  if (year) return year;

  const loose = await searchReleaseGroup(artist, album, false);
  return pickReleaseYear(loose);
}

function ensureAlbumYear(artist, album) {
  if (!artist || !album) return Promise.resolve(null);

  const cached = getCachedYear.get(artist, album);
  const fresh = cached?.updated_at > Date.now() - YEAR_TTL_MS;
  const usable = cached?.updated_at > Date.now() - FAILURE_TTL_MS;

  if (fresh && cached.release_year) return Promise.resolve(cached.release_year);
  if (usable && !cached?.release_year) return Promise.resolve(null);

  const key = `${String(artist).toLocaleLowerCase()}\u0000${String(album).toLocaleLowerCase()}`;
  if (inFlight.has(key)) return inFlight.get(key);

  const request = fetchAlbumYear(artist, album)
    .then(year => {
      saveCachedYear.run(artist, album, year, Date.now());
      return year;
    })
    .catch(() => {
      saveCachedYear.run(artist, album, null, Date.now());
      return null;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}

module.exports = { ensureAlbumYear };
