const db = require("../db");
const { invalidateDashboardCache } = require("./dashboardCache");

const findDeletedScrobble = db.prepare(`
  SELECT 1
  FROM deleted_scrobbles
  WHERE artist = ? AND track = ? AND played_at = ?
`);

const insertDeletedScrobble = db.prepare(`
  INSERT OR IGNORE INTO deleted_scrobbles (artist, track, played_at)
  VALUES (?, ?, ?)
`);

const deleteScrobbleRow = db.prepare(`
  DELETE FROM scrobbles
  WHERE artist = ? AND track = ? AND played_at = ?
`);

const countDeletedScrobbles = db.prepare(`
  SELECT COUNT(*) AS count
  FROM deleted_scrobbles
`);

function isDeletedScrobble(artist, track, playedAt) {
  return Boolean(findDeletedScrobble.get(artist, track, playedAt));
}

function getDeletedScrobblesCount() {
  return countDeletedScrobbles.get().count;
}

function deleteScrobbleLocally(artist, track, playedAt) {
  const deleted = deleteScrobbleRow.run(artist, track, playedAt).changes;

  if (deleted > 0) {
    insertDeletedScrobble.run(artist, track, playedAt);
    invalidateDashboardCache();
  }

  return deleted;
}

module.exports = {
  deleteScrobbleLocally,
  isDeletedScrobble,
  getDeletedScrobblesCount
};
