import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { formatTimestampDate, formatTimestampDateTime } from "./dates.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

let currentTrack = null;
let loadId = 0;
let activeRequest = null;

export function getCurrentTrack() {
  return currentTrack;
}

export function showTrack(artist, track) {
  if (!artist || !track) return;
  location.hash = `track/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`;
}

function showLoadingState() {
  const name = document.getElementById("track-name");
  if (name) name.textContent = "…";

  for (const id of ["track-stats", "track-scrobbles"]) {
    const element = document.getElementById(id);
    if (element) element.textContent = "";
  }

  const note = document.getElementById("track-scrobble-note");
  note?.classList.add("d-none");

  const image = document.getElementById("track-image");
  if (image) image.src = "/images/cover-placeholder.svg";
}

function renderTrackStats(data) {
  const element = document.getElementById("track-stats");
  if (!element) return;

  const chips = [
    data.year ? `<span class="detail-stat"><strong>${escapeHTML(String(data.year))}</strong></span>` : "",
    `<span class="detail-stat"><strong>${Number(data.plays || 0).toLocaleString()}</strong> ${escapeHTML(t("common.playsUnit"))}</span>`,
    `<span class="detail-stat">${escapeHTML(t("track.rank", { rank: data.artistRank }))}</span>`,
    `<span class="detail-stat">${escapeHTML(t("artist.firstListen"))} : <strong>${escapeHTML(formatTimestampDate((data.firstPlay || 0) * 1000))}</strong></span>`,
    `<span class="detail-stat">${escapeHTML(t("artist.lastListen"))} : <strong>${escapeHTML(formatTimestampDate((data.lastPlay || 0) * 1000))}</strong></span>`
  ].filter(Boolean);

  element.innerHTML = chips.join("");
}

function renderScrobbles(data) {
  const container = document.getElementById("track-scrobbles");
  if (!container) return;

  container.innerHTML = (data.scrobbles || []).map(scrobble => `
    <div class="track-history-row">
      <span class="track-history-date">${escapeHTML(formatTimestampDateTime((scrobble.playedAt || 0) * 1000))}</span>
      <small>${escapeHTML(scrobble.album || "")}</small>
    </div>
  `).join("");

  const note = document.getElementById("track-scrobble-note");
  if (note) {
    const shown = (data.scrobbles || []).length;
    const total = Number(data.plays || 0);
    const showNote = shown < total;
    note.classList.toggle("d-none", !showNote);
    if (showNote) {
      note.textContent = t("track.scrobbleNote", { shown: shown.toLocaleString(), total: total.toLocaleString() });
    }
  }
}

function renderTrackPage(data) {
  const image = document.getElementById("track-image");
  if (image) {
    image.src = safeImageUrl(data.image) || "/images/cover-placeholder.svg";
    image.alt = data.track;
    if (data.album) {
      image.dataset.albumArtist = data.artist;
      image.dataset.albumName = data.album;
    } else {
      delete image.dataset.albumArtist;
      delete image.dataset.albumName;
    }
    installImageFallbacks(image.parentElement);
  }

  const name = document.getElementById("track-name");
  if (name) name.textContent = data.track;

  const artistLink = document.getElementById("track-artist");
  if (artistLink) {
    artistLink.dataset.artist = data.artist;
    artistLink.title = t("artist.viewPage");
    artistLink.querySelector("strong").textContent = data.artist;
  }

  const albumWrapper = document.getElementById("track-album-wrapper");
  const albumLink = document.getElementById("track-album");
  if (albumWrapper && albumLink) {
    if (data.album) {
      albumWrapper.classList.remove("d-none");
      albumLink.dataset.albumArtist = data.artist;
      albumLink.dataset.albumName = data.album;
      albumLink.title = t("album.viewPage");
      albumLink.textContent = data.album;
    } else {
      albumWrapper.classList.add("d-none");
    }
  }

  renderTrackStats(data);

  const lastfmLink = document.getElementById("track-lastfm");
  if (lastfmLink) {
    if (data.url) {
      lastfmLink.href = data.url;
      lastfmLink.classList.remove("d-none");
    } else {
      lastfmLink.classList.add("d-none");
    }
  }

  renderScrobbles(data);
}

export async function loadTrack(artist, track) {
  if (!artist || !track) return;
  const key = `${artist}\u0000${track}`;
  if (currentTrack === key && activeRequest) return;

  currentTrack = key;
  const request = ++loadId;
  activeRequest = request;
  showLoadingState();

  try {
    const data = await fetchJSON(
      `/api/track/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`,
      { cache: "no-store" }
    );

    if (request !== loadId || currentTrack !== key) return;
    renderTrackPage(data);
  } catch (error) {
    console.error("Error loading track page:", error);
  } finally {
    if (activeRequest === request) activeRequest = null;
  }
}
