import { t } from "./i18n.js";
import { renderCover, initCoverUploads } from "./coverUploader.js";
import { showAlbum } from "./albumPage.js";
import { escapeAttribute, escapeHTML } from "./dom.js";

export function renderAlbums(albums = [], containerId = "albums-grid") {
  const grid = document.getElementById(containerId);
  const fragment = document.createDocumentFragment();

  grid.innerHTML = "";

  for (const album of albums) {
    const card = document.createElement("div");
    card.className = "album-card";
    card.innerHTML = `
      ${renderCover({
        image: album.album_image,
        artist: album.artist,
        album: album.album,
        size: "large"
      })}
      <a
        class="music-link album-title-link"
        data-album-artist="${escapeAttribute(album.artist)}"
        data-album-name="${escapeAttribute(album.album)}"
        title="${t("album.viewPage")}"
      >
        <strong>${escapeHTML(album.album)}</strong>
      </a>
      <a
        class="music-link album-artist-link"
        data-artist="${escapeAttribute(album.artist)}"
        title="${t("artist.viewPage")}"
      >${escapeHTML(album.artist)}</a>
      <small>${Number(album.plays).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}</small>
    `;

    card.querySelector(".cover-wrapper")?.addEventListener("click", event => {
      if (event.target.matches("input, .cover-overlay, .cover-overlay *")) return;

      showAlbum(album.artist, album.album);
    });

    fragment.appendChild(card);
  }

  grid.appendChild(fragment);
  initCoverUploads();
}
