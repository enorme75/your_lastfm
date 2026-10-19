import { t } from "./i18n.js";
import { fetchJSON } from "./api.js";
import { buildQuery } from "./filters.js";
import { renderCover, initCoverUploads } from "./coverUploader.js";
import { escapeAttribute, escapeHTML } from "./dom.js";

function formatDuration(totalSeconds) {
  const secondsValue = Number(totalSeconds) || 0;
  const hours = Math.floor(secondsValue / 3600);
  const minutes = Math.floor((secondsValue % 3600) / 60);
  const seconds = secondsValue % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function songCopy(row) {
  return `
    <div class="song-copy">
      <strong
        class="song-title"
        data-track-artist="${escapeAttribute(row.artist)}"
        data-track-name="${escapeAttribute(row.track)}"
        title="${t("track.viewPage")}"
      >
        ${escapeHTML(row.track)}
      </strong>
      <a
        class="music-link"
        href="${escapeAttribute(row.url || "#")}"
        target="_blank"
        rel="noopener noreferrer"
        title="${t("dashboard.openTrackOnLastfm")}"
      >
        <i class="mdi mdi-open-in-new"></i>
      </a>
      <a
        class="music-link song-artist"
        data-artist="${escapeAttribute(row.artist)}"
        title="${t("artist.viewPage")}"
      >${escapeHTML(row.artist)}</a>
    </div>
  `;
}

function albumCoverTarget(row) {
  if (!row.album) return renderCover({ image: row.album_image, artist: row.artist, album: row.album });
  return `
    <div
      class="song-cover-target"
      data-album-artist="${escapeAttribute(row.artist)}"
      data-album-name="${escapeAttribute(row.album)}"
    >
      ${renderCover({ image: row.album_image, artist: row.artist, album: row.album })}
    </div>
  `;
}

function songPodiumItem(row, index) {
  return `
    <div class="top-podium-item">
      <span class="rank">${index + 1}</span>
      ${albumCoverTarget(row)}
      <div>
        ${songCopy(row)}
        <span class="top-podium-plays">${Number(row.plays).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}</span>
      </div>
    </div>
  `;
}

function songRow(row, index) {
  return `
    <div class="top-song-row">
      <span class="song-position">${index + 1}</span>
      <div class="song-main">
        ${albumCoverTarget(row)}
        ${songCopy(row)}
      </div>
      <span>${Number(row.plays).toLocaleString()}</span>
      <span>${formatDuration(row.total_seconds)}</span>
    </div>
  `;
}

export function renderTopSongs(data = []) {
  const podium = document.getElementById("top-songs-podium");
  const container = document.getElementById("top-songs");

  podium.innerHTML = data.slice(0, 3).map((row, index) => songPodiumItem(row, index)).join("");
  container.innerHTML = data.slice(3).map((row, index) => songRow(row, index + 3)).join("");

  initCoverUploads();
}

export async function loadTopSongs() {
  const data = await fetchJSON("/api/top-tracks" + buildQuery());
  renderTopSongs(data);
}
