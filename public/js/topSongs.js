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
      <a
        class="music-link song-title"
        href="${escapeAttribute(row.url || "#")}"
        target="_blank"
        rel="noopener noreferrer"
        title="${t("dashboard.openTrackOnLastfm")}"
      >
        ${escapeHTML(row.track)}
        <i class="mdi mdi-open-in-new"></i>
      </a>
      <a
        class="music-link song-artist"
        href="${escapeAttribute(row.artist_url || "#")}"
        target="_blank"
        rel="noopener noreferrer"
        title="${t("dashboard.openArtistOnLastfm")}"
      >${escapeHTML(row.artist)}</a>
    </div>
  `;
}

function songPodiumItem(row, index) {
  return `
    <div class="top-podium-item">
      <span class="rank">${index + 1}</span>
      ${renderCover({
        image: row.album_image,
        artist: row.artist,
        album: row.album
      })}
      <div>
        ${songCopy(row)}
        <span class="top-podium-plays">${Number(row.plays).toLocaleString()} plays</span>
      </div>
    </div>
  `;
}

function songRow(row, index) {
  return `
    <div class="top-song-row">
      <span class="song-position">${index + 1}</span>
      <div class="song-main">
        ${renderCover({
          image: row.album_image,
          artist: row.artist,
          album: row.album
        })}
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
