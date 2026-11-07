import { t } from "./i18n.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

function artistRow(artist, index) {
  return `
    <div class="top-row" data-artist="${escapeAttribute(artist.artist)}">
      <span class="rank">${index + 1}</span>
      <img
        src="${escapeAttribute(safeImageUrl(artist.image))}"
        alt="${escapeAttribute(artist.artist)}"
        class="cover artist"
        loading="lazy"
        decoding="async"
        data-fallback="/images/artist-placeholder.png"
      />
      <div class="meta">
        <strong>${escapeHTML(artist.artist)}</strong>
        <a
          class="music-link artist-name-link"
          href="${escapeAttribute(artist.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          title="${t("dashboard.openArtistOnLastfm")}"
        >
          <i class="mdi mdi-open-in-new"></i>
        </a>
        <small>${Number(artist.plays).toLocaleString()} ${escapeHTML(t("common.playsUnit"))}</small>
      </div>
    </div>
  `;
}

export function renderTopArtists(data = [], { podiumId = "top-artists-podium", restId = "top-artists" } = {}) {
  const podium = document.getElementById(podiumId);
  const rest = document.getElementById(restId);
  if (!podium || !rest) return;

  podium.innerHTML = data.slice(0, 3).map((artist, index) => artistRow(artist, index)).join("");
  rest.innerHTML = data.slice(3).map((artist, index) => artistRow(artist, index + 3)).join("");

  installImageFallbacks(podium);
  installImageFallbacks(rest);
}
