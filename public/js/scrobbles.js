import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { escapeAttribute, escapeHTML, safeImageUrl } from "./dom.js";

let currentPage = 1;
let loading = false;

export async function loadScrobbles(reset = true) {
  if (loading) return;
  loading = true;

  const button = document.getElementById("load-more-scrobbles");
  const container = document.getElementById("scrobbles-list");

  if (reset) {
    currentPage = 1;
    button.classList.add("d-none");
    container.innerHTML = "";
  }

  button.disabled = true;

  try {
    const data = await fetchJSON(`/api/recent-scrobbles?page=${currentPage}`, {
      cache: "no-store"
    });

    const html = (data.tracks || []).map(scrobble => `
      <div class="scrobble-item">
        <div class="scrobble-cover">
          ${scrobble.image
            ? `<img
                src="${escapeAttribute(safeImageUrl(scrobble.image))}"
                alt="${escapeAttribute(scrobble.track)}"
                loading="lazy"
              />`
            : '<div class="cover-placeholder"></div>'}
        </div>
        <div class="scrobble-info">
          <div class="scrobble-track">${escapeHTML(scrobble.track)}</div>
          <div class="scrobble-artist">${escapeHTML(scrobble.artist)}</div>
          <div class="scrobble-time">
            ${scrobble.nowPlaying
              ? `<i class="mdi mdi-access-point me-1 text-green"></i>${t("scrobbles.listeningNow")}`
              : timeAgo(scrobble.date)}
          </div>
        </div>
        ${scrobble.delete_url
          ? `<a
              class="scrobble-delete"
              href="${escapeAttribute(scrobble.delete_url)}"
              target="_blank"
              rel="noopener noreferrer"
              title="Delete this scrobble on Last.fm"
              ${scrobble.date
                ? `data-artist="${escapeAttribute(scrobble.artist)}" data-track="${escapeAttribute(scrobble.track)}" data-date="${scrobble.date}"`
                : ""}
            ><i class="mdi mdi-delete-outline"></i></a>`
          : ""}
      </div>
    `).join("");

    container.insertAdjacentHTML("beforeend", html);
    button.classList.toggle("d-none", !data.hasMore);
    currentPage++;
  } catch (error) {
    console.error("Error loading scrobbles:", error);
    if (reset) {
      container.innerHTML = `<p class="text-danger">${escapeHTML(error.message)}</p>`;
    }
  } finally {
    loading = false;
    button.disabled = false;
  }
}

document.getElementById("load-more-scrobbles")?.addEventListener("click", () => {
  loadScrobbles(false);
});

document.getElementById("scrobbles-list")?.addEventListener("click", async event => {
  const link = event.target.closest(".scrobble-delete");
  if (!link || !link.dataset.date) return;

  const confirmed = window.confirm(
    t("scrobbles.deleteConfirm")
  );
  if (!confirmed) return;

  try {
    await fetchJSON("/api/scrobbles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist: link.dataset.artist,
        track: link.dataset.track,
        date: Number(link.dataset.date)
      })
    });
  } catch (error) {
    console.error("Error deleting scrobble locally:", error);
    window.alert(t("scrobbles.deleteFailed", { message: error.message }));
  }
});

function timeAgo(timestamp) {
  if (!timestamp) return "";

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diff < 60) return t("scrobbles.justNow");
  if (diff < 3600) return t("scrobbles.minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("scrobbles.hoursAgo", { count: Math.floor(diff / 3600) });
  return t("scrobbles.daysAgo", { count: Math.floor(diff / 86400) });
}
