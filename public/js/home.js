import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { scrobbleItemHTML, bindScrobbleDelete } from "./scrobbles.js";
import { renderAlbums } from "./albums.js";
import { renderTopArtists } from "./artists.js";
import { renderTopSongs } from "./topSongs.js";
import { formatTimestampDate } from "./dates.js";
import { installImageFallback, installImageFallbacks, safeImageUrl } from "./dom.js";
import { showToast } from "./toast.js";

const HOME_SCROBBLE_LIMIT = 50;
const RANGE_BY_PILL = {
  "7d": "week",
  "30d": "30days",
  "365d": "year",
  "all": ""
};
const DEFAULT_PILL = "7d";

let activePill = DEFAULT_PILL;
let homeLoadCounter = 0;
let homeAbortController = null;
let topsLoadCounter = 0;
let topsAbortController = null;

export function isHomeVisible() {
  return !document.getElementById("home-view")?.classList.contains("d-none");
}

function topsQuery(pill) {
  const params = new URLSearchParams();
  if (RANGE_BY_PILL[pill]) params.append("range", RANGE_BY_PILL[pill]);
  params.set("tzOffset", String(new Date().getTimezoneOffset()));
  return `?${params.toString()}`;
}

function renderHomeHeader(stats = {}) {
  const avatar = document.getElementById("home-avatar");
  if (avatar) {
    avatar.src = safeImageUrl(stats.avatar);
    installImageFallback(avatar);
  }

  document.getElementById("home-username").textContent =
    stats.username || t("account.user");

  const memberSince = document.getElementById("home-member-since");
  memberSince.textContent = stats.joinedDate
    ? t("home.memberSince", { date: formatTimestampDate(stats.joinedDate * 1000) })
    : "";

  const format = value => Number(value || 0).toLocaleString();
  document.getElementById("home-total-scrobbles").textContent = format(stats.totalScrobbles);
  document.getElementById("home-total-artists").textContent = format(stats.uniqueArtists);
  document.getElementById("home-total-albums").textContent = format(stats.uniqueAlbums);
  document.getElementById("home-total-tracks").textContent = format(stats.uniqueTracks);
}

async function loadHomeHeader(signal) {
  const stats = await fetchJSON("/api/user-stats", { cache: "no-store", signal });
  renderHomeHeader(stats);
}

async function loadHomeScrobbles(signal) {
  const data = await fetchJSON(
    `/api/recent-scrobbles?page=1&limit=${HOME_SCROBBLE_LIMIT}`,
    { cache: "no-store", signal }
  );

  const list = document.getElementById("home-scrobbles-list");
  list.innerHTML = (data.tracks || [])
    .map(scrobble => scrobbleItemHTML(scrobble, { compact: true }))
    .join("");
}

export function loadHomeTops() {
  const loadId = ++topsLoadCounter;
  topsAbortController?.abort();
  topsAbortController = new AbortController();

  const loading = document.getElementById("home-tops-loading");
  const content = document.getElementById("home-tops-content");
  loading?.classList.remove("d-none");
  content?.classList.add("is-loading");

  fetchJSON(`/api/dashboard${topsQuery(activePill)}`, {
    cache: "no-store",
    signal: topsAbortController.signal
  })
    .then(data => {
      if (loadId !== topsLoadCounter) return;
      renderAlbums(data.topAlbums, "home-albums-grid");
      renderTopArtists(data.topArtists, { podiumId: "home-artists-podium", restId: "home-artists" });
      renderTopSongs(data.topTracks, { podiumId: "home-songs-podium", listId: "home-songs" });
    })
    .catch(error => {
      if (error.name === "AbortError" || loadId !== topsLoadCounter) return;
      console.error("Error loading home tops:", error);
      showToast(error.message || t("home.topsError"), "error");
    })
    .finally(() => {
      if (loadId !== topsLoadCounter) return;
      loading?.classList.add("d-none");
      content?.classList.remove("is-loading");
    });
}

export async function loadHome() {
  const loadId = ++homeLoadCounter;
  homeAbortController?.abort();
  homeAbortController = new AbortController();

  const loading = document.getElementById("home-loading");
  loading.style.display = "flex";

  const jobs = [
    loadHomeHeader(homeAbortController.signal).catch(error => {
      if (error.name === "AbortError" || loadId !== homeLoadCounter) return;
      console.error("Error loading home header:", error);
      showToast(error.message || t("home.loadError"), "error");
    }),
    loadHomeScrobbles(homeAbortController.signal).catch(error => {
      if (error.name === "AbortError" || loadId !== homeLoadCounter) return;
      console.error("Error loading home scrobbles:", error);
      showToast(error.message || t("home.loadError"), "error");
    })
  ];

  await Promise.allSettled(jobs);
  if (loadId === homeLoadCounter) loading.style.display = "none";

  loadHomeTops();
}

function setActivePill() {
  document.querySelectorAll("[data-home-range]").forEach(pill => {
    pill.classList.toggle("active", pill.dataset.homeRange === activePill);
  });
}

function initHome() {
  document.querySelectorAll("[data-home-range]").forEach(pill => {
    pill.addEventListener("click", () => {
      if (pill.dataset.homeRange === activePill) return;
      activePill = pill.dataset.homeRange;
      setActivePill();
      loadHomeTops();
    });
  });

  bindScrobbleDelete(document.getElementById("home-scrobbles-list"));
  setActivePill();
}

initHome();
