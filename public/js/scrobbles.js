import { fetchJSON } from "./api.js";
import { t, getLocale } from "./i18n.js";
import { escapeAttribute, escapeHTML, safeImageUrl } from "./dom.js";

let currentPage = 1;
let loading = false;
let lastDayKey = null;
let activePeriod = null;

export function setScrobblePeriod(period) {
  activePeriod = period;
  updatePeriodBanner();
}

export function hasScrobblePeriod() {
  return Boolean(activePeriod);
}

function updatePeriodBanner() {
  const banner = document.getElementById("scrobbles-period-banner");
  if (!banner) return;

  if (!activePeriod) {
    banner.classList.add("d-none");
    return;
  }

  document.getElementById("scrobbles-period-label").textContent = activePeriod.label;
  document.getElementById("scrobbles-period-count").textContent = "";
  banner.classList.remove("d-none");
}

function dayHeaderHTML(date) {
  const locale = getLocale() === "en" ? "en-GB" : "fr-FR";
  const label = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);

  return `<div class="scrobbles-day-header">${escapeHTML(capitalized)}</div>`;
}

function scrobbleBlocks(scrobble, options) {
  const blocks = [];
  const date = new Date(scrobble.date ?? Date.now());
  const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  if (dayKey !== lastDayKey) {
    lastDayKey = dayKey;
    blocks.push(dayHeaderHTML(date));
  }

  blocks.push(scrobbleItemHTML(scrobble, options));
  return blocks.join("");
}

export function scrobbleItemHTML(scrobble, { compact = false, clock = false, localDelete = false, deleteLabel = "" } = {}) {
  return `
    <div class="scrobble-item${compact ? " compact" : ""}" data-artist="${escapeAttribute(scrobble.artist)}">
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
        <div
          class="scrobble-track"
          data-track-artist="${escapeAttribute(scrobble.artist)}"
          data-track-name="${escapeAttribute(scrobble.track)}"
          title="${escapeAttribute(t("track.viewPage"))}"
        >${escapeHTML(scrobble.track)}</div>
        <div
          class="scrobble-artist"
          data-artist="${escapeAttribute(scrobble.artist)}"
          title="${escapeAttribute(t("artist.viewPage"))}"
        >${escapeHTML(scrobble.artist)}</div>
        <div class="scrobble-time">
          ${scrobble.nowPlaying
            ? `<i class="mdi mdi-access-point me-1 text-green"></i>${t("scrobbles.listeningNow")}`
            : clock
              ? clockTime(scrobble.date)
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
        : localDelete && scrobble.date
          ? `<button
              type="button"
              class="scrobble-delete"
              title="${escapeAttribute(deleteLabel)}"
              data-local="1"
              data-artist="${escapeAttribute(scrobble.artist)}"
              data-track="${escapeAttribute(scrobble.track)}"
              data-date="${scrobble.date}"
            ><i class="mdi mdi-delete-outline"></i></button>`
          : ""}
    </div>
  `;
}

function clockTime(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime()) || !timestamp) return "";

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function bindScrobbleDelete(container) {
  container?.addEventListener("click", async event => {
    const link = event.target.closest(".scrobble-delete");
    if (!link || !link.dataset.date) return;

    const confirmed = window.confirm(
      link.dataset.local === "1" ? t("scrobbles.deleteLocalConfirm") : t("scrobbles.deleteConfirm")
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

      if (activePeriod) loadScrobbles(true);
    } catch (error) {
      console.error("Error deleting scrobble locally:", error);
      window.alert(t("scrobbles.deleteFailed", { message: error.message }));
    }
  });
}

async function fetchScrobblePage(page) {
  if (activePeriod) {
    const data = await fetchJSON(
      `/api/scrobbles?page=${page}&from=${activePeriod.from}&to=${activePeriod.to}`,
      { cache: "no-store" }
    );

    document.getElementById("scrobbles-period-count").textContent = t(
      "scrobbles.periodCount",
      { count: Number(data.total || 0).toLocaleString() }
    );

    return {
      tracks: data.tracks || [],
      hasMore: Boolean(data.hasMore),
      options: { clock: true, localDelete: true, deleteLabel: t("scrobbles.deleteLocal") }
    };
  }

  const data = await fetchJSON(`/api/recent-scrobbles?page=${page}`, {
    cache: "no-store"
  });

  return {
    tracks: data.tracks || [],
    hasMore: Boolean(data.hasMore),
    options: {}
  };
}

export async function loadScrobbles(reset = true) {
  if (loading) return;
  loading = true;

  const button = document.getElementById("load-more-scrobbles");
  const container = document.getElementById("scrobbles-list");

  if (reset) {
    currentPage = 1;
    lastDayKey = null;
    button.classList.add("d-none");
    container.innerHTML = "";
    updatePeriodBanner();
  }

  button.disabled = true;

  try {
    const { tracks, hasMore, options } = await fetchScrobblePage(currentPage);

    container.insertAdjacentHTML(
      "beforeend",
      tracks.map(scrobble => scrobbleBlocks(scrobble, options)).join("")
    );
    button.classList.toggle("d-none", !hasMore);
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

document.getElementById("scrobbles-period-clear")?.addEventListener("click", () => {
  setScrobblePeriod(null);
  loadScrobbles(true);
});

bindScrobbleDelete(document.getElementById("scrobbles-list"));

function timeAgo(timestamp) {
  if (!timestamp) return "";

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diff < 60) return t("scrobbles.justNow");
  if (diff < 3600) return t("scrobbles.minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("scrobbles.hoursAgo", { count: Math.floor(diff / 3600) });
  return t("scrobbles.daysAgo", { count: Math.floor(diff / 86400) });
}
