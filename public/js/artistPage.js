import { fetchJSON } from "./api.js";
import { t, getLocale } from "./i18n.js";
import { formatTimestampDate } from "./dates.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

let currentArtist = null;
let loadId = 0;
let activeRequest = null;

export function getCurrentArtist() {
  return currentArtist;
}

export function showArtist(name) {
  if (!name) return;
  location.hash = `artist/${encodeURIComponent(name)}`;
}

function showLoadingState() {
  const name = document.getElementById("artist-name");
  if (name) name.textContent = "…";

  for (const id of ["artist-stats", "artist-bio", "artist-top-tracks", "artist-albums"]) {
    const element = document.getElementById(id);
    if (element) element.textContent = "";
  }

  const image = document.getElementById("artist-image");
  if (image) image.src = "/images/artist-placeholder.png";
}

function renderArtistStats(data) {
  const element = document.getElementById("artist-stats");
  if (!element) return;

  element.innerHTML = [
    `<span class="artist-stat"><strong>${Number(data.plays || 0).toLocaleString()}</strong> ${escapeHTML(t("common.playsUnit"))}</span>`,
    `<span class="artist-stat"><strong>${Number(data.uniqueAlbums || 0).toLocaleString()}</strong> ${escapeHTML(t("artist.albumsStat", { count: "" }).trim())}</span>`,
    `<span class="artist-stat"><strong>${Number(data.uniqueTracks || 0).toLocaleString()}</strong> ${escapeHTML(t("artist.tracksStat", { count: "" }).trim())}</span>`,
    `<span class="artist-stat">${escapeHTML(t("artist.firstListen"))} : <strong>${escapeHTML(formatTimestampDate((data.firstPlay || 0) * 1000))}</strong></span>`,
    `<span class="artist-stat">${escapeHTML(t("artist.lastListen"))} : <strong>${escapeHTML(formatTimestampDate((data.lastPlay || 0) * 1000))}</strong></span>`
  ].join("");
}

function renderTopTracks(data) {
  const container = document.getElementById("artist-top-tracks");
  if (!container) return;

  container.innerHTML = (data.topTracks || []).map((row, index) => `
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

function renderAlbums(data) {
  const container = document.getElementById("artist-albums");
  if (!container) return;

  container.innerHTML = (data.albums || []).map(album => `
    <div class="artist-album" data-album="${escapeAttribute(data.artist + "\u0000" + album.album)}">
      <a class="music-link" title="${escapeAttribute(t("album.viewPage"))}">
        <img
          src="${escapeAttribute(safeImageUrl(album.image))}
          alt="${escapeAttribute(album.album)}"
          loading="lazy"
          decoding="async"
          data-fallback="/images/cover-placeholder.svg"
        >
        <strong>${escapeHTML(album.album)}</strong>
      </a>
      <small>
        ${album.year ? `<span class="artist-album-year">${escapeHTML(String(album.year))}</span> · ` : ""}
        ${Number(album.plays || 0).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}
      </small>
    </div>
  `).join("");

  installImageFallbacks(container);
}

function renderArtist(data) {
  const image = document.getElementById("artist-image");
  if (image) {
    image.src = safeImageUrl(data.image) || "/images/artist-placeholder.png";
    image.alt = data.artist;
    installImageFallbacks(image.parentElement);
  }

  const name = document.getElementById("artist-name");
  if (name) name.textContent = data.artist;

  renderArtistStats(data);

  const lastfmLink = document.getElementById("artist-lastfm");
  if (lastfmLink) {
    if (data.lastfmUrl) {
      lastfmLink.href = data.lastfmUrl;
      lastfmLink.classList.remove("d-none");
    } else {
      lastfmLink.classList.add("d-none");
    }
  }

  const bio = document.getElementById("artist-bio");
  if (bio) bio.textContent = data.bio || t("artist.noBio");

  renderTopTracks(data);
  renderAlbums(data);
}

export async function loadArtist(name) {
  if (!name) return;
  if (name === currentArtist && activeRequest) return;

  currentArtist = name;
  const request = ++loadId;
  activeRequest = request;
  showLoadingState();

  try {
    const lang = getLocale().slice(0, 2);
    const data = await fetchJSON(
      `/api/artist/${encodeURIComponent(name)}?lang=${lang}`,
      { cache: "no-store" }
    );

    if (request !== loadId || currentArtist !== name) return;
    renderArtist(data);
  } catch (error) {
    console.error("Error loading artist page:", error);
  } finally {
    if (activeRequest === request) activeRequest = null;
  }
}
