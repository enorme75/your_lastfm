import { fetchJSON } from "./api.js";
import { initFilters, buildQuery } from "./filters.js";
import { renderSummary } from "./summary.js";
import { renderAlbums } from "./albums.js";
import { renderDailyChart, renderListeningClock } from "./charts.js";
import { loadInsights } from "./insights.js";
import { formatTimestampDate } from "./dates.js";
import { t, setLocale, getNextLocale, applyStaticTranslations } from "./i18n.js";
import { renderTopSongs } from "./topSongs.js";
import { renderTopArtists } from "./artists.js";
import { loadScrobbles } from "./scrobbles.js";
import { loadAccount } from "./account.js";
import { initSharePage } from "./share.js";
import { loadFriends } from "./friends.js";
import { loadLeaderboards } from "./leaderboards.js";
import { loadArtist, showArtist, getCurrentArtist } from "./artistPage.js";
import { loadAlbum, showAlbum, getCurrentAlbum } from "./albumPage.js";

const UI = {
  loading: document.getElementById("global-loading"),
  sections: document.querySelectorAll("[id$='-view']"),
  sidebarButtons: document.querySelectorAll(".sidebar-link"),
  sidebar: document.querySelector(".sidebar"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),
  sidebarOpenButton: document.getElementById("open-sidebar"),
  syncButton: document.getElementById("sync-btn"),
  lastSync: document.getElementById("last-sync"),
  dashboardCacheState: document.getElementById("dashboard-cache-state")
};

let syncPollTimer = null;
let dashboardLoadCounter = 0;
let dashboardAbortController = null;

function isDashboardVisible() {
  return !document.getElementById("dashboard-view")?.classList.contains("d-none");
}

function syncStatusText(status = {}) {
  if (status.messageKey) return t(status.messageKey, status.messageParams || {});
  return status.message || "";
}

function formatLastSync(timestamp) {
  if (!timestamp) return `${t("dashboard.lastSyncPrefix")} ${t("common.never")}`;
  const time = new Date(timestamp).toLocaleTimeString();
  return `${t("dashboard.lastSyncPrefix")} ${formatTimestampDate(timestamp)} ${time}`;
}

function renderSyncState(timestamp, status = {}) {
  if (!UI.lastSync || !UI.syncButton) return;

  if (status.running) {
    const progress = status.totalPages
      ? ` (${status.page || 0}/${status.totalPages})`
      : "";

    UI.lastSync.textContent = `${syncStatusText(status)}${progress}`;
    UI.syncButton.disabled = true;
    UI.syncButton.innerHTML = `<i class="mdi mdi-loading mdi-spin"></i> ${t("dashboard.syncing")}`;
    return;
  }

  UI.lastSync.textContent = formatLastSync(timestamp);
  UI.syncButton.disabled = false;
  UI.syncButton.innerHTML = `<i class="mdi mdi-sync"></i> ${t("dashboard.sync")}`;
}

function renderDashboardCacheState(cache = {}) {
  if (!UI.dashboardCacheState) return;

  const cachedAt = Number(cache.cachedAt || 0);
  if (!cachedAt) {
    UI.dashboardCacheState.textContent = "";
    return;
  }

  const prefix = cache.hit ? t("dashboard.cacheLoaded") : t("dashboard.cacheRefreshed");
  UI.dashboardCacheState.textContent = `${prefix} · ${new Date(cachedAt).toLocaleTimeString()}`;
}

async function refreshSyncState() {
  const data = await fetchJSON("/api/last-sync", { cache: "no-store" });
  renderSyncState(data.timestamp, data.status);
  return data;
}

function stopSyncPolling() {
  if (!syncPollTimer) return;
  clearTimeout(syncPollTimer);
  syncPollTimer = null;
}

async function pollSyncUntilFinished() {
  stopSyncPolling();

  try {
    const data = await refreshSyncState();

    if (data.status?.running) {
      syncPollTimer = setTimeout(pollSyncUntilFinished, 1500);
      return;
    }

    if (data.status?.error) {
      showToast(syncStatusText(data.status) || t("dashboard.syncFailed"), "error");
      return;
    }

    showToast(syncStatusText(data.status) || t("dashboard.syncCompleted"), "success");
    if (isDashboardVisible()) await reloadDashboardData({ skipSyncRefresh: true });
  } catch (error) {
    console.error("Could not read sync status:", error);
    syncPollTimer = setTimeout(pollSyncUntilFinished, 3000);
  }
}

function initSyncControls() {
  if (!UI.syncButton) return;

  UI.syncButton.addEventListener("click", async () => {
    UI.syncButton.disabled = true;

    try {
      await fetchJSON("/api/sync", {
        method: "POST",
        cache: "no-store"
      });
      showToast(t("dashboard.syncStarted"), "info");
    } catch (error) {
      if (error.status !== 409) {
        showToast(error.message, "error");
        await refreshSyncState().catch(() => {});
        return;
      }

      showToast(t("dashboard.syncAlreadyRunning"), "info");
    }

    pollSyncUntilFinished();
  });

  refreshSyncState()
    .then(data => {
      if (data.status?.running) pollSyncUntilFinished();
    })
    .catch(error => console.error("Could not load sync status:", error));
}

function renderDashboard(data) {
  renderSummary(data.summary);
  renderAlbums(data.topAlbums);
  renderTopSongs(data.topTracks);
  renderTopArtists(data.topArtists);
  renderDailyChart(data.playsPerDay);
  renderListeningClock(data.listeningClock);
  renderDashboardCacheState(data.cache);
}

async function reloadDashboardData({ skipSyncRefresh = false } = {}) {
  const loadId = ++dashboardLoadCounter;
  dashboardAbortController?.abort();
  dashboardAbortController = new AbortController();
  UI.loading.style.display = "flex";

  try {
    const query = buildQuery({ tzOffset: new Date().getTimezoneOffset() });
    const data = await fetchJSON(`/api/dashboard${query}`, {
      cache: "no-store",
      signal: dashboardAbortController.signal
    });

    if (loadId !== dashboardLoadCounter) return;
    renderDashboard(data);

    if (!skipSyncRefresh) await refreshSyncState();
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Error loading dashboard:", error);
    showToast(error.message || t("dashboard.loadError"), "error");
  } finally {
    if (loadId === dashboardLoadCounter) UI.loading.style.display = "none";
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `sync-toast ${type}`;
  toast.textContent = message;

  document.getElementById("toast-container")?.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    UI.sidebar?.classList.remove("open");
    UI.sidebarOverlay?.classList.remove("active");
  }
}

function initSidebar() {
  UI.sidebarOpenButton?.addEventListener("click", () => {
    UI.sidebar?.classList.add("open");
    UI.sidebarOverlay?.classList.add("active");
  });

  UI.sidebarOverlay?.addEventListener("click", () => {
    UI.sidebar?.classList.remove("open");
    UI.sidebarOverlay.classList.remove("active");
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    UI.sidebar?.classList.remove("open");
    UI.sidebarOverlay?.classList.remove("active");
  }
});

function toggleView(viewName) {
  if (!document.getElementById(`${viewName}-view`)) viewName = "dashboard";
  if (viewName !== "artist" && viewName !== "album" && location.hash.startsWith("#artist/")) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  if (viewName !== "album" && viewName !== "artist" && location.hash.startsWith("#album/")) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  localStorage.setItem("activeView", viewName);

  UI.sidebarButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  UI.sections.forEach(section => {
    section.classList.toggle("d-none", section.id !== `${viewName}-view`);
  });

  switch (viewName) {
    case "dashboard":
      reloadDashboardData();
      break;
    case "scrobbles":
      loadScrobbles(true);
      break;
    case "friends":
      loadFriends();
      break;
    case "leaderboards":
      loadLeaderboards();
      break;
    case "insights":
      loadInsights();
      break;
    case "artist":
      loadArtist(getCurrentArtist());
      break;
    case "album": {
      const current = getCurrentAlbum();
      if (current) {
        const [artist, album] = current.split("\u0000");
        loadAlbum(artist, album);
      }
      break;
    }
    case "account":
      loadAccount();
      break;
  }

  closeSidebarOnMobile();
}

function parseArtistHash() {
  const match = /^#artist\/(.+)$/.exec(location.hash);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseAlbumHash() {
  const match = /^#album\/(.+)\/(.+)$/.exec(location.hash);
  return match
    ? { artist: decodeURIComponent(match[1]), album: decodeURIComponent(match[2]) }
    : null;
}

function initArtistRouting() {
  document.getElementById("artist-back")?.addEventListener("click", () => {
    toggleView("dashboard");
  });

  document.getElementById("album-back")?.addEventListener("click", () => {
    const current = getCurrentAlbum();
    if (current) {
      const [artist] = current.split("\u0000");
      if (artist) {
        showArtist(artist);
        return;
      }
    }
    toggleView("dashboard");
  });

  window.addEventListener("hashchange", () => {
    const album = parseAlbumHash();
    if (album) {
      loadAlbum(album.artist, album.album);
      toggleView("album");
      return;
    }

    const artist = parseArtistHash();
    if (!artist) return;
    loadArtist(artist);
    toggleView("artist");
  });

  document.addEventListener("click", event => {
    const albumTarget = event.target.closest("[data-album-artist]");
    const albumArtist = albumTarget?.dataset?.albumArtist;
    const albumName = albumTarget?.dataset?.albumName;
    if (albumArtist && albumName && !event.target.closest("a[href]")) {
      document.querySelectorAll(".modal.show").forEach(modal => {
        window.bootstrap?.getInstance(modal)?.hide();
      });
      showAlbum(albumArtist, albumName);
      return;
    }

    if (event.target.closest("a[href]")) return;
    const target = event.target.closest("[data-artist]");
    const artist = target?.dataset?.artist;
    if (!artist) return;

    document.querySelectorAll(".modal.show").forEach(modal => {
      window.bootstrap?.getInstance(modal)?.hide();
    });

    showArtist(artist);
  });
}

UI.sidebarButtons.forEach(button => {
  if (!button.dataset.view) return;
  button.addEventListener("click", () => toggleView(button.dataset.view));
});

initFilters(() => {
  if (isDashboardVisible()) reloadDashboardData();
});

function updateLocaleToggleLabel() {
  const label = document.getElementById("locale-toggle-label");
  if (label) label.textContent = getNextLocale().toUpperCase();
}

function initLocaleToggle() {
  updateLocaleToggleLabel();

  document.getElementById("locale-toggle")?.addEventListener("click", () => {
    setLocale(getNextLocale());
  });

  window.addEventListener("localechange", () => {
    updateLocaleToggleLabel();
    const currentView = localStorage.getItem("activeView") || "dashboard";
    toggleView(currentView);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticTranslations();
  initSidebar();
  initSharePage();
  initSyncControls();
  initLocaleToggle();
  initArtistRouting();

  const albumFromHash = parseAlbumHash();
  const artistFromHash = parseArtistHash();
  const savedView = albumFromHash
    ? "album"
    : artistFromHash
      ? "artist"
      : localStorage.getItem("activeView") || "dashboard";

  toggleView(savedView);
  if (albumFromHash) loadAlbum(albumFromHash.artist, albumFromHash.album);
  if (artistFromHash) loadArtist(artistFromHash);
});
