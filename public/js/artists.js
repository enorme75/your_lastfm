import { fetchJSON } from "./api.js";
import { buildQuery } from "./filters.js";
import { escapeAttribute, escapeHTML, installImageFallbacks, safeImageUrl } from "./dom.js";

function artistRow(artist, index) {
  return `
    <div class="top-row">
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
        <a
          class="music-link artist-name-link"
          href="${escapeAttribute(artist.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir l'artiste sur Last.fm"
        >
          <strong>${escapeHTML(artist.artist)}</strong>
          <i class="mdi mdi-open-in-new"></i>
        </a>
        <small>${Number(artist.plays).toLocaleString()} plays</small>
      </div>
    </div>
  `;
}

export function renderTopArtists(data = []) {
  const podium = document.getElementById("top-artists-podium");
  const rest = document.getElementById("top-artists");

  podium.innerHTML = data.slice(0, 3).map((artist, index) => artistRow(artist, index)).join("");
  rest.innerHTML = data.slice(3).map((artist, index) => artistRow(artist, index + 3)).join("");

  installImageFallbacks(podium);
  installImageFallbacks(rest);
}

export async function loadTopArtists() {
  const data = await fetchJSON("/api/top-artists" + buildQuery());
  renderTopArtists(data);
}
