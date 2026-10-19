import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

let currentQuery = null;
let loadId = 0;

export function getCurrentSearch() {
  return currentQuery;
}

export function showSearch(query) {
  if (!query) return;
  location.hash = `search/${encodeURIComponent(query)}`;
}

function renderArtists(artists) {
  const container = document.getElementById("search-artists");
  if (!container) return;

  container.innerHTML = artists.map((artist, index) => `
    <div class="top-row" data-artist="${escapeAttribute(artist.artist)}">
      <span class="rank">${index + 1}</span>
      <img
        src="${escapeAttribute(safeImageUrl(artist.image, "/images/artist-placeholder.png"))}"
        alt="${escapeAttribute(artist.artist)}"
        class="cover artist"
        loading="lazy"
        decoding="async"
        data-fallback="/images/artist-placeholder.png"
      >
      <div class="meta">
        <strong>${escapeHTML(artist.artist)}</strong>
        <small>${Number(artist.plays || 0).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}</small>
      </div>
    </div>
  `).join("");

  installImageFallbacks(container);
}

function renderAlbums(albums) {
  const container = document.getElementById("search-albums");
  if (!container) return;

  container.innerHTML = albums.map(album => `
    <div
      class="artist-album"
      data-album-artist="${escapeAttribute(album.artist)}"
      data-album-name="${escapeAttribute(album.album)}"
    >
      <img
        src="${escapeAttribute(safeImageUrl(album.image, "/images/cover-placeholder.svg"))}"
        alt="${escapeAttribute(album.album)}"
        loading="lazy"
        decoding="async"
        data-fallback="/images/cover-placeholder.svg"
      >
      <strong title="${escapeAttribute(album.album)}">${escapeHTML(album.album)}</strong>
      <small>${escapeHTML(album.artist)}</small>
    </div>
  `).join("");

  installImageFallbacks(container);
}

function renderTracks(tracks) {
  const container = document.getElementById("search-tracks");
  if (!container) return;

  container.innerHTML = tracks.map((row, index) => `
    <div class="top-row" data-track-artist="${escapeAttribute(row.artist)}" data-track-name="${escapeAttribute(row.track)}">
      <span class="rank">${index + 1}</span>
      <div class="meta">
        <strong title="${escapeAttribute(t("track.viewPage"))}">${escapeHTML(row.track)}</strong>
        <a
          class="music-link"
          href="${escapeAttribute(row.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          title="${escapeAttribute(t("dashboard.openTrackOnLastfm"))}"
        >
          <i class="mdi mdi-open-in-new"></i>
        </a>
        <small>
          ${escapeHTML(row.artist)} · ${Number(row.plays || 0).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}
        </small>
      </div>
    </div>
  `).join("");
}

function renderSearchResults(data, query) {
  const title = document.getElementById("search-query");
  if (title) title.textContent = `« ${query} »`;

  const empty = document.getElementById("search-empty");
  const hasResults =
    (data.artists?.length || 0) + (data.albums?.length || 0) + (data.tracks?.length || 0) > 0;

  if (empty) {
    empty.classList.toggle("d-none", hasResults);
    if (!hasResults) empty.textContent = t("search.noResults", { query });
  }

  renderArtists(data.artists || []);
  renderAlbums(data.albums || []);
  renderTracks(data.tracks || []);
}

function showLoadingState() {
  const title = document.getElementById("search-query");
  if (title) title.textContent = "…";

  for (const id of ["search-artists", "search-albums", "search-tracks"]) {
    const element = document.getElementById(id);
    if (element) element.textContent = "";
  }

  const empty = document.getElementById("search-empty");
  empty?.classList.add("d-none");
}

export async function loadSearch(query) {
  if (!query || query.length < 2) return;
  if (query === currentQuery) return;

  currentQuery = query;
  const request = ++loadId;
  showLoadingState();

  try {
    const data = await fetchJSON(`/api/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store"
    });

    if (request !== loadId || currentQuery !== query) return;
    renderSearchResults(data, query);
  } catch (error) {
    console.error("Error loading search results:", error);
  }
}
