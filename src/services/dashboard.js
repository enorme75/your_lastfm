const db = require("../db");
const { fillMissingDates } = require("../utils/dateRange");
const { getDashboardFilterContext, getTimezoneOffset } = require("../utils/dashboardFilter");
const { getArtistUrl, getAlbumUrl, getTrackUrl } = require("../utils/lastfmUrl");
const { calculateChange, normalizeSummary } = require("../utils/dashboardMetrics");
const { mapWithConcurrency } = require("../utils/mapWithConcurrency");
const { ensureAlbumCover } = require("./albumCoverCache");
const { ensureArtistImage } = require("./artistImageCache");
const { ensureTrackDuration } = require("./trackDurationCache");
const { withDashboardCache } = require("./dashboardCache");

const AVG_TRACK_SECONDS = 180;
const EXTERNAL_REQUEST_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.EXTERNAL_REQUEST_CONCURRENCY || "4", 10) || 4
);

function whereClause(filter, prefix = "WHERE") {
  return filter.where ? `${prefix} ${filter.where}` : "";
}

function getSummaryRow(filter) {
  return db.prepare(`
    SELECT
      COUNT(*) AS totalPlays,
      COUNT(DISTINCT date(played_at, 'unixepoch')) AS days,
      COALESCE(SUM(COALESCE(track_duration, ?)), 0) AS totalSeconds
    FROM scrobbles
    ${whereClause(filter)}
  `).get(AVG_TRACK_SECONDS, ...filter.params);
}

function getSummary(context) {
  const current = normalizeSummary(getSummaryRow(context.current));
  if (!context.previous) {
    return {
      ...current,
      comparison: null,
      comparisonNote: context.comparisonNote
    };
  }

  const previous = normalizeSummary(getSummaryRow(context.previous));
  return {
    ...current,
    comparison: {
      label: context.comparisonLabel,
      totalPlays: calculateChange(current.totalPlays, previous.totalPlays),
      totalMinutes: calculateChange(current.totalMinutes, previous.totalMinutes),
      avgPerDay: calculateChange(current.avgPerDay, previous.avgPerDay)
    }
  };
}

function getTopArtistRows(filter) {
  return db.prepare(`
    SELECT artist, COUNT(*) AS plays
    FROM scrobbles
    ${whereClause(filter)}
    GROUP BY artist
    ORDER BY plays DESC
    LIMIT 10
  `).all(...filter.params);
}

function getTopAlbumRows(filter) {
  return db.prepare(`
    SELECT
      artist,
      album,
      MAX(NULLIF(album_image, '')) AS album_image,
      COUNT(*) AS plays
    FROM scrobbles
    WHERE album IS NOT NULL
      AND TRIM(album) != ''
      ${filter.where ? `AND ${filter.where}` : ""}
    GROUP BY artist, album
    ORDER BY plays DESC
    LIMIT 12
  `).all(...filter.params);
}

function getTopTrackRows(filter) {
  return db.prepare(`
    SELECT
      track,
      artist,
      album,
      MAX(NULLIF(album_image, '')) AS album_image,
      COUNT(*) AS plays
    FROM scrobbles
    WHERE album IS NOT NULL
      AND TRIM(album) != ''
      ${filter.where ? `AND ${filter.where}` : ""}
    GROUP BY track, artist, album
    ORDER BY plays DESC
    LIMIT 20
  `).all(...filter.params);
}

function getPlaysPerDay(filter, query) {
  const rows = db.prepare(`
    SELECT
      date(played_at, 'unixepoch') AS day,
      COUNT(*) AS plays
    FROM scrobbles
    ${whereClause(filter)}
    GROUP BY day
    ORDER BY day
  `).all(...filter.params);

  return fillMissingDates(rows, query.range, query.year, query.month);
}

function getListeningClock(filter, timezoneOffset) {
  const modifier = `${timezoneOffset > 0 ? "-" : "+"}${Math.abs(timezoneOffset)} minutes`;
  const rows = db.prepare(`
    SELECT
      CAST(strftime('%H', played_at, 'unixepoch', ?) AS INTEGER) AS hour,
      COUNT(*) AS plays
    FROM scrobbles
    ${whereClause(filter)}
    GROUP BY hour
    ORDER BY hour
  `).all(modifier, ...filter.params);
  const values = new Map(rows.map(row => [Number(row.hour), Number(row.plays)]));
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    plays: values.get(hour) || 0
  }));
  const peak = hours.reduce((best, item) => item.plays > best.plays ? item : best, hours[0]);

  return {
    hours,
    peakHour: peak.plays > 0 ? peak.hour : null,
    peakPlays: peak.plays,
    timezoneOffset
  };
}

function getPlaysPerWeek(filter) {
  return db.prepare(`
    SELECT
      strftime('%Y-%W', played_at, 'unixepoch') AS week,
      COUNT(*) AS plays
    FROM scrobbles
    ${whereClause(filter)}
    GROUP BY week
    ORDER BY week
  `).all(...filter.params);
}

function getActivityCalendar(timezoneOffset, now = Date.now()) {
  const modifier = `${timezoneOffset > 0 ? "-" : "+"}${Math.abs(timezoneOffset)} minutes`;
  const shifted = new Date(now - timezoneOffset * 60000);
  const start = new Date(shifted.getTime() - 370 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return db.prepare(`
    SELECT
      date(played_at, 'unixepoch', ?) AS day,
      COUNT(*) AS plays
    FROM scrobbles
    WHERE date(played_at, 'unixepoch', ?) >= ?
    GROUP BY day
    ORDER BY day
  `).all(modifier, modifier, start);
}

function getArtistEvolution(filter, topCount = 6) {
  const topArtists = db.prepare(`
    SELECT artist
    FROM scrobbles
    ${whereClause(filter)}
    GROUP BY artist
    ORDER BY COUNT(*) DESC
    LIMIT ?
  `).all(...filter.params, topCount);

  if (topArtists.length === 0) {
    return { artists: [], months: [], series: [] };
  }

  const placeholders = topArtists.map(() => "?").join(", ");
  const series = db.prepare(`
    SELECT
      artist,
      strftime('%Y-%m', played_at, 'unixepoch') AS month,
      COUNT(*) AS plays
    FROM scrobbles
    WHERE artist IN (${placeholders})
      ${filter.where ? `AND ${filter.where}` : ""}
    GROUP BY artist, month
    ORDER BY month
  `).all(...topArtists.map(row => row.artist), ...filter.params);

  const months = [...new Set(series.map(row => row.month))].sort();

  return {
    artists: topArtists.map(row => row.artist),
    months,
    series
  };
}

function createLookupTasks(artists, albums, tracks) {
  const tasks = new Map();

  for (const row of artists) {
    const key = `artist:${row.artist.toLocaleLowerCase()}`;
    tasks.set(key, {
      key,
      fallback: null,
      run: () => ensureArtistImage(row.artist)
    });
  }

  for (const row of [...albums, ...tracks]) {
    const key = `album:${row.artist.toLocaleLowerCase()}\u0000${row.album.toLocaleLowerCase()}`;
    if (!tasks.has(key)) {
      tasks.set(key, {
        key,
        fallback: row.album_image || null,
        run: () => ensureAlbumCover(row.artist, row.album)
      });
    }
  }

  for (const row of tracks) {
    const key = `duration:${row.artist.toLocaleLowerCase()}\u0000${row.track.toLocaleLowerCase()}`;
    tasks.set(key, {
      key,
      fallback: AVG_TRACK_SECONDS,
      run: () => ensureTrackDuration(row.artist, row.track)
    });
  }

  return Array.from(tasks.values());
}

async function enrichDashboardLists(artists, albums, tracks) {
  const values = new Map();
  const tasks = createLookupTasks(artists, albums, tracks);

  await mapWithConcurrency(tasks, EXTERNAL_REQUEST_CONCURRENCY, async task => {
    try {
      values.set(task.key, await task.run() ?? task.fallback);
    } catch {
      values.set(task.key, task.fallback);
    }
  });

  return {
    artists: artists.map(row => ({
      ...row,
      image: values.get(`artist:${row.artist.toLocaleLowerCase()}`) || null,
      url: getArtistUrl(row.artist)
    })),
    albums: albums.map(row => ({
      ...row,
      album_image: values.get(
        `album:${row.artist.toLocaleLowerCase()}\u0000${row.album.toLocaleLowerCase()}`
      ) || row.album_image || null,
      url: getAlbumUrl(row.artist, row.album),
      artist_url: getArtistUrl(row.artist)
    })),
    tracks: tracks.map(row => {
      const duration = Number(values.get(
        `duration:${row.artist.toLocaleLowerCase()}\u0000${row.track.toLocaleLowerCase()}`
      )) || AVG_TRACK_SECONDS;

      return {
        ...row,
        album_image: values.get(
          `album:${row.artist.toLocaleLowerCase()}\u0000${row.album.toLocaleLowerCase()}`
        ) || row.album_image || null,
        total_seconds: duration * Number(row.plays || 0),
        url: getTrackUrl(row.artist, row.track),
        artist_url: getArtistUrl(row.artist),
        album_url: getAlbumUrl(row.artist, row.album)
      };
    })
  };
}

async function buildDashboard(query, context) {
  const summary = getSummary(context);
  const artistRows = getTopArtistRows(context.current);
  const albumRows = getTopAlbumRows(context.current);
  const trackRows = getTopTrackRows(context.current);
  const playsPerDay = getPlaysPerDay(context.current, query);
  const listeningClock = getListeningClock(context.current, context.timezoneOffset);
  const lists = await enrichDashboardLists(artistRows, albumRows, trackRows);

  return {
    summary,
    topArtists: lists.artists,
    topAlbums: lists.albums,
    topTracks: lists.tracks,
    playsPerDay,
    listeningClock
  };
}

async function getInsights(query = {}) {
  const timezoneOffset = getTimezoneOffset(query);
  const allTimeFilter = { where: null, params: [] };

  const result = await withDashboardCache(`insights:tz${timezoneOffset}`, () => ({
    activityCalendar: getActivityCalendar(timezoneOffset),
    playsPerWeek: getPlaysPerWeek(allTimeFilter),
    artistEvolution: getArtistEvolution(allTimeFilter)
  }));

  return {
    ...result.data,
    cache: result.cache
  };
}

async function getDashboard(query = {}) {
  const context = getDashboardFilterContext(query);
  const result = await withDashboardCache(context.cacheKey, () => buildDashboard(query, context));

  return {
    ...result.data,
    cache: result.cache
  };
}

module.exports = { getDashboard, getInsights, getListeningClock };
