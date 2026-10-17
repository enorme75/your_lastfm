const test = require("node:test");
const assert = require("node:assert/strict");

const { getArtistUrl, getAlbumUrl, getTrackUrl, getUserLibraryTrackUrl } = require("../src/utils/lastfmUrl");

test("builds encoded Last.fm links for dashboard items", () => {
  assert.equal(
    getArtistUrl("Tyler, The Creator"),
    "https://www.last.fm/music/Tyler%2C+The+Creator"
  );
  assert.equal(
    getAlbumUrl("Björk", "Debut / Live"),
    "https://www.last.fm/music/Bj%C3%B6rk/Debut+%2F+Live"
  );
  assert.equal(
    getTrackUrl("Radiohead", "How to Disappear Completely"),
    "https://www.last.fm/music/Radiohead/_/How+to+Disappear+Completely"
  );
});

test("does not build incomplete Last.fm links", () => {
  assert.equal(getArtistUrl(""), null);
  assert.equal(getAlbumUrl("Artist", ""), null);
  assert.equal(getTrackUrl("", "Track"), null);
});

test("builds user library links for scrobble deletion", () => {
  assert.equal(
    getUserLibraryTrackUrl("OUF", "Radiohead", "How to Disappear Completely"),
    "https://www.last.fm/user/OUF/library/music/Radiohead/How+to+Disappear+Completely"
  );
  assert.equal(getUserLibraryTrackUrl("", "Artist", "Track"), null);
  assert.equal(getUserLibraryTrackUrl("OUF", "", "Track"), null);
  assert.equal(getUserLibraryTrackUrl("OUF", "Artist", ""), null);
});
