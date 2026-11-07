const MODE_BY_VIEW = {
  "stats-month": "month",
  "stats-year": "year",
  "stats-all": "all"
};

let statsMode = "all";

export function getStatsMode() {
  return statsMode;
}

function currentValue(select, fallback) {
  return select?.value || String(fallback);
}

export function buildStatsQuery() {
  const params = new URLSearchParams();
  const now = new Date();

  if (statsMode === "month" || statsMode === "year") {
    const year = currentValue(document.getElementById("year"), now.getFullYear());
    if (year) params.append("year", year);
  }

  if (statsMode === "month") {
    const month = currentValue(document.getElementById("month"), now.getMonth() + 1);
    if (month) params.append("month", month);
  }

  params.set("tzOffset", String(new Date().getTimezoneOffset()));

  return `?${params.toString()}`;
}

function applyModeDefaults() {
  const yearSelect = document.getElementById("year");
  const monthSelect = document.getElementById("month");
  const now = new Date();

  if (!yearSelect || !monthSelect) return;

  if (statsMode === "month" || statsMode === "year") {
    if (!yearSelect.value) yearSelect.value = String(now.getFullYear());
  }

  if (statsMode === "month" && !monthSelect.value) {
    monthSelect.value = String(now.getMonth() + 1);
  }
}

function syncSelectVisibility() {
  document.getElementById("stats-year-group")?.classList.toggle("d-none", statsMode === "all");
  document.getElementById("stats-month-group")?.classList.toggle("d-none", statsMode !== "month");
}

export function setStatsMode(viewName) {
  statsMode = MODE_BY_VIEW[viewName] || "all";
  applyModeDefaults();
  syncSelectVisibility();
}

export function initStatsFilters(onChange) {
  const yearSelect = document.getElementById("year");
  const monthSelect = document.getElementById("month");
  const currentYear = new Date().getFullYear();

  if (yearSelect) {
    yearSelect.innerHTML = "";
    for (let year = currentYear; year >= 2002; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }

    yearSelect.addEventListener("change", onChange);
  }

  monthSelect?.addEventListener("change", onChange);

  syncSelectVisibility();
}
