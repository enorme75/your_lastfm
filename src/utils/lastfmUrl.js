function encodePathSegment(value) {
  return encodeURIComponent(String(value || "").trim()).replace(/%20/g, "+");
}

function buildLastFmUrl(...segments) {
  const safeSegments = segments.map(encodePathSegment);
  if (safeSegments.some(segment => !segment)) return null;
  return `https://www.last.fm/music/${safeSegments.join("/")}`;
}

function getArtistUrl(artist) {
  return buildLastFmUrl(artist);
}

function getAlbumUrl(artist, album) {
  return buildLastFmUrl(artist, album);
}

function getTrackUrl(artist, track) {
  return buildLastFmUrl(artist, "_", track);
}

const LASTFM_TRACK_URL_PREFIX = "https://www.last.fm/music/";

function getUserLibraryTrackUrl(username, trackUrl) {
  const safeUsername = encodePathSegment(username);
  if (!safeUsername || typeof trackUrl !== "string") return null;
  if (!trackUrl.startsWith(LASTFM_TRACK_URL_PREFIX)) return null;
  const segments = trackUrl
    .slice(LASTFM_TRACK_URL_PREFIX.length)
    .split("/")
    .filter(segment => segment);
  if (segments.length === 0) return null;
  return `https://www.last.fm/user/${safeUsername}/library/music/${segments.join("/")}`;
}

module.exports = { getArtistUrl, getAlbumUrl, getTrackUrl, getUserLibraryTrackUrl };
