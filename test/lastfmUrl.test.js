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
    getUserLibraryTrackUrl("OUF", "https://www.last.fm/music/Eels/_/New+Story"),
    "https://www.last.fm/user/OUF/library/music/Eels/New+Story"
  );
  assert.equal(
    getUserLibraryTrackUrl(
      "OUF",
      "https://www.last.fm/music/Prince/_/It%27s+Gonna+Be+a+Beautiful+Night"
    ),
    "https://www.last.fm/user/OUF/library/music/Prince/It%27s+Gonna+Be+a+Beautiful+Night"
  );
  assert.equal(
    getUserLibraryTrackUrl("OUF", "https://www.last.fm/music/Artist/Album/Track"),
    "https://www.last.fm/user/OUF/library/music/Artist/Album/Track"
  );
  assert.equal(getUserLibraryTrackUrl("", "https://www.last.fm/music/Artist/_/Track"), null);
  assert.equal(getUserLibraryTrackUrl("OUF", ""), null);
  assert.equal(getUserLibraryTrackUrl("OUF", "https://example.com/music/Artist/_/Track"), null);
  assert.equal(getUserLibraryTrackUrl("OUF", "https://www.last.fm/music/"), null);
});
