import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { formatTimestampDate } from "./dates.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

let currentAlbum = null;
let loadId = 0;
let activeRequest = null;

export function getCurrentAlbum() {
  return currentAlbum;
}

export function showAlbum(artist, album) {
  if (!artist || !album) return;
  location.hash = `album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`;
}

function showLoadingState() {
  const name = document.getElementById("album-name");
  if (name) name.textContent = "…";

  for (const id of ["album-stats", "album-tracks"]) {
    const element = document.getElementById(id);
    if (element) element.textContent = "";
  }

  const image = document.getElementById("album-image");
  if (image) image.src = "/images/cover-placeholder.svg";
}

function renderAlbumStats(data) {
  const element = document.getElementById("album-stats");
  if (!element) return;

  const chips = [
    data.year ? `<span class="detail-stat"><strong>${escapeHTML(String(data.year))}</strong></span>` : "",
    `<span class="detail-stat"><strong>${Number(data.plays || 0).toLocaleString()}</strong> ${escapeHTML(t("common.playsUnit"))}</span>`,
    `<span class="detail-stat"><strong>${Number(data.uniqueTracks || 0).toLocaleString()}</strong> ${escapeHTML(t("album.tracksStat", { count: "" }).trim())}</span>`,
    `<span class="detail-stat">${escapeHTML(t("artist.firstListen"))} : <strong>${escapeHTML(formatTimestampDate((data.firstPlay || 0) * 1000))}</strong></span>`,
    `<span class="detail-stat">${escapeHTML(t("artist.lastListen"))} : <strong>${escapeHTML(formatTimestampDate((data.lastPlay || 0) * 1000))}</strong></span>`
  ].filter(Boolean);

  element.innerHTML = chips.join("");
}

function renderTracks(data) {
  const container = document.getElementById("album-tracks");
  if (!container) return;

  container.innerHTML = (data.tracks || []).map((row, index) => `
    <div class="top-row">
      <span class="rank">${index + 1}</span>
      <div class="meta">
        <a
          class="music-link"
          href="${escapeAttribute(row.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          title="${escapeAttribute(t("dashboard.openTrackOnLastfm"))}"
        >
          <strong>${escapeHTML(row.track)}</strong>
          <i class="mdi mdi-open-in-new"></i>
        </a>
        <small>${Number(row.plays || 0).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}</small>
      </div>
    </div>
  `).join("");
}

function renderAlbumPage(data) {
  const image = document.getElementById("album-image");
  if (image) {
    image.src = safeImageUrl(data.image) || "/images/cover-placeholder.svg";
    image.alt = data.album;
    installImageFallbacks(image.parentElement);
  }

  const name = document.getElementById("album-name");
  if (name) name.textContent = data.album;

  const artistLink = document.getElementById("album-artist");
  if (artistLink) {
    artistLink.dataset.artist = data.artist;
    artistLink.title = t("artist.viewPage");
    artistLink.querySelector("strong").textContent = data.artist;
  }

  renderAlbumStats(data);

  const lastfmLink = document.getElementById("album-lastfm");
  if (lastfmLink) {
    if (data.url) {
      lastfmLink.href = data.url;
      lastfmLink.classList.remove("d-none");
    } else {
      lastfmLink.classList.add("d-none");
    }
  }

  renderTracks(data);
}

export async function loadAlbum(artist, album) {
  if (!artist || !album) return;
  const key = `${artist}\u0000${album}`;
  if (currentAlbum === key && activeRequest) return;

  currentAlbum = key;
  const request = ++loadId;
  activeRequest = request;
  showLoadingState();

  try {
    const data = await fetchJSON(
      `/api/album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`,
      { cache: "no-store" }
    );

    if (request !== loadId || currentAlbum !== key) return;
    renderAlbumPage(data);
  } catch (error) {
    console.error("Error loading album page:", error);
  } finally {
    if (activeRequest === request) activeRequest = null;
  }
}
