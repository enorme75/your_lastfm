const axios = require("axios");
const db = require("../db");
const { fetchWithRetry } = require("../utils/fetchRetry");
const { assertLastFmResponse } = require("../utils/lastfmResponse");
const { sanitizeError } = require("../utils/sanitizeAxios");

const REQUEST_TIMEOUT = Number(process.env.LASTFM_REQUEST_TIMEOUT_MS || 15000);
const BIO_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = Math.max(
  60000,
  Number(process.env.METADATA_FAILURE_CACHE_MS) || 10 * 60 * 1000
);

const getCachedInfo = db.prepare(`
  SELECT artist, lang, bio, lastfm_url, updated_at
  FROM artist_info
  WHERE artist = ? COLLATE NOCASE
`);

const saveCachedInfo = db.prepare(`
  INSERT INTO artist_info (artist, lang, bio, lastfm_url, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(artist) DO UPDATE SET
    lang = excluded.lang,
    bio = excluded.bio,
    lastfm_url = excluded.lastfm_url,
    updated_at = excluded.updated_at
`);

const inFlight = new Map();

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCachedArtistInfo(artist, lang) {
  const cached = getCachedInfo.get(artist);
  if (!cached) return null;

  const usable = cached.updated_at > Date.now() - FAILURE_TTL_MS;

  if (!cached.bio && !usable) return null;
  if (cached.lang !== lang) return null;

  return {
    bio: cached.bio || null,
    lastfmUrl: cached.lastfm_url || null
  };
}

async function fetchArtistInfo(artist, lang) {
  const { data } = await fetchWithRetry(async () =>
    axios.get("https://ws.audioscrobbler.com/2.0/", {
      timeout: REQUEST_TIMEOUT,
      params: {
        method: "artist.getinfo",
        artist,
        api_key: process.env.LASTFM_API_KEY,
        lang,
        format: "json"
      }
    })
  );
  assertLastFmResponse(data);

  const info = data?.artist;
  if (!info) return null;

  const megaImage = Array.isArray(info.image)
    ? info.image.find(entry => entry?.size === "mega")?.["#text"] || null
    : null;

  return {
    bio: stripHtml(info?.bio?.summary) || null,
    lastfmUrl: info?.url || null,
    image: megaImage
  };
}

async function ensureArtistInfo(artist, lang = "en") {
  if (!artist || !process.env.LASTFM_API_KEY) return null;

  const cached = getCachedArtistInfo(artist, lang);
  if (cached) return cached;

  const key = `${String(artist).toLocaleLowerCase()}:${lang}`;
  if (inFlight.has(key)) return inFlight.get(key);

  const request = fetchArtistInfo(artist, lang)
    .then(info => {
      if (info) {
        saveCachedInfo.run(
          artist,
          lang,
          info.bio,
          info.lastfmUrl,
          Date.now()
        );
      } else {
        saveCachedInfo.run(artist, lang, null, null, Date.now());
      }
      return info;
    })
    .catch(error => {
      console.warn(
        `[artistInfo] could not load Last.fm bio for "${artist}":`,
        sanitizeError(error).message
      );
      saveCachedInfo.run(artist, lang, null, null, Date.now());
      return null;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}

module.exports = { ensureArtistInfo };
