const axios = require("axios");
const db = require("../db");
const { fetchWithRetry } = require("../utils/fetchRetry");

// Discogs API : token optionnel (DISCOGS_TOKEN). Sans token les recherches
// fonctionnent mais avec un rate limit plus bas (25 req/min par IP).
const DISCOGS_API_URL = "https://api.discogs.com";
const DISCOGS_SITE_URL = "https://www.discogs.com";
const DISCOGS_USER_AGENT = "your_lastfm/1.0 (personal self-hosted fork)";
const REQUEST_TIMEOUT = Number(process.env.IMAGE_REQUEST_TIMEOUT_MS || 10000);
const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = Math.max(
  60000,
  Number(process.env.METADATA_FAILURE_CACHE_MS) || 10 * 60 * 1000
);

const getCachedLink = db.prepare(`
  SELECT url, payload, updated_at
  FROM discogs_links
  WHERE kind = ? AND artist = ? COLLATE NOCASE AND album = ? COLLATE NOCASE
`);

const saveCachedLink = db.prepare(`
  INSERT INTO discogs_links (kind, artist, album, url, payload, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(kind, artist, album) DO UPDATE SET
    url = excluded.url,
    payload = excluded.payload,
    updated_at = excluded.updated_at
`);

const inFlight = new Map();

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

async function discogsGet(path, params) {
  const headers = { "User-Agent": DISCOGS_USER_AGENT };
  if (process.env.DISCOGS_TOKEN) {
    headers.Authorization = `Discogs token=${process.env.DISCOGS_TOKEN}`;
  }

  const { data } = await fetchWithRetry(
    () => axios.get(`${DISCOGS_API_URL}${path}`, { timeout: REQUEST_TIMEOUT, headers, params }),
    2,
    1000
  );

  return data;
}

function searchDiscogs(params) {
  return discogsGet("/database/search", params)
    .then(data => (Array.isArray(data?.results) ? data.results : []));
}

function pickArtistResult(results, artist) {
  const wanted = normalize(artist);
  return (
    results.find(result => result?.type === "artist" && normalize(result.title) === wanted) ||
    results.find(result => result?.type === "artist") ||
    null
  );
}

function pickMasterResult(results, artist, album) {
  const candidates = results.filter(result => result?.type === "master");
  const wanted = normalize(album);
  const artistPrefix = `${normalize(artist)} - `;

  const exact = candidates.find(result => normalize(result.title) === `${artistPrefix}${wanted}`);
  if (exact) return exact;

  const prefixed = candidates.find(result => {
    const title = normalize(result.title);
    return title.startsWith(`${artistPrefix}${wanted} `) ||
      title.startsWith(`${artistPrefix}${wanted}(`);
  });
  if (prefixed) return prefixed;

  const contains = candidates.find(result => {
    const title = normalize(result.title);
    return title.startsWith(artistPrefix) && title.includes(wanted);
  });

  return contains || null;
}

async function fetchArtistInfo(artist) {
  const results = await searchDiscogs({ type: "artist", q: artist, per_page: 10 });
  const match = pickArtistResult(results, artist);

  if (!match?.id) return null;

  let info = {
    url: match.uri ? `${DISCOGS_SITE_URL}${match.uri}` : null,
    members: null
  };

  try {
    const detail = await discogsGet(`/artists/${match.id}`);
    if (Array.isArray(detail?.members)) {
      info.members = detail.members
        .filter(member => member?.name)
        .map(member => ({ name: member.name, active: member.active !== false }));
    }
  } catch (error) {
    console.warn(`⚠️ [Discogs] Artist details failed: ${artist}`, error.message);
  }

  return info;
}

async function fetchMasterInfo(artist, album) {
  const results = await searchDiscogs({ type: "master", q: `${artist} ${album}`, per_page: 10 });
  const match = pickMasterResult(results, artist, album);

  if (!match?.id) return null;

  let info = {
    url: match.uri ? `${DISCOGS_SITE_URL}${match.uri}` : null,
    genres: null,
    styles: null,
    label: null,
    tracklist: null
  };

  try {
    const detail = await discogsGet(`/masters/${match.id}`);

    info.genres = Array.isArray(detail?.genres) ? detail.genres : [];
    info.styles = Array.isArray(detail?.styles) ? detail.styles : [];
    info.label = detail?.labels?.[0]?.name || null;

    if (Array.isArray(detail?.tracklist)) {
      info.tracklist = detail.tracklist
        .filter(entry => entry?.type_ === "track" && entry.title)
        .map(entry => ({
          position: entry.position || "",
          title: entry.title,
          duration: entry.duration || null
        }));
    }
  } catch (error) {
    console.warn(`⚠️ [Discogs] Master details failed: ${artist} - ${album}`, error.message);
  }

  return info;
}

function ensureDiscogsInfo(kind, artist, album, fetcher) {
  const cached = getCachedLink.get(kind, artist, album || "");
  const fresh = cached?.updated_at > Date.now() - LINK_TTL_MS;
  const usable = cached?.updated_at > Date.now() - FAILURE_TTL_MS;

  if (fresh && cached.url && cached.payload) {
    return Promise.resolve({ url: cached.url, ...JSON.parse(cached.payload) });
  }
  if (usable && !cached?.url) return Promise.resolve(null);

  const key = `${kind}\u0000${String(artist).toLocaleLowerCase()}\u0000${String(album || "").toLocaleLowerCase()}`;
  if (inFlight.has(key)) return inFlight.get(key);

  const request = fetcher()
    .then(info => {
      const { url, ...payload } = info || {};
      saveCachedLink.run(
        kind,
        artist,
        album || "",
        url || null,
        info ? JSON.stringify(payload) : null,
        Date.now()
      );
      return info;
    })
    .catch(() => {
      saveCachedLink.run(kind, artist, album || "", null, null, Date.now());
      return null;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}

function ensureDiscogsArtistLink(artist) {
  if (!artist) return Promise.resolve(null);
  artist = String(artist).trim();
  return ensureDiscogsInfo("artist", artist, null, () => fetchArtistInfo(artist));
}

function ensureDiscogsAlbumLink(artist, album) {
  artist = String(artist || "").trim();
  album = String(album || "").trim();
  if (!artist || !album) return Promise.resolve(null);
  return ensureDiscogsInfo("album", artist, album, () => fetchMasterInfo(artist, album));
}

module.exports = { ensureDiscogsArtistLink, ensureDiscogsAlbumLink };
