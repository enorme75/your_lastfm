import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { buildQuery } from "./filters.js";
import { escapeHTML } from "./dom.js";

let avgScope = "filter";

function applyAvgLabel() {
  const element = document.getElementById("avg-label");
  if (!element) return;

  if (avgScope === "year") {
    element.removeAttribute("data-i18n");
    element.innerHTML = `
      <span>${escapeHTML(t("dashboard.dailyAverageYearMain"))}</span><br>
      <small class="avg-label-detail">${escapeHTML(t("dashboard.dailyAverageYearDetail"))}</small>
    `;
    return;
  }

  element.dataset.i18n = "dashboard.dailyAverage";
  element.textContent = t("dashboard.dailyAverage");
}

window.addEventListener("localechange", applyAvgLabel);

function renderTrend(elementId, metric, label, note) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const resolvedLabel = metric?.labelKey
    ? t(`comparison.${metric.labelKey}`)
    : metric?.label || label;

  element.className = "metric-trend";

  if (!metric || !resolvedLabel) {
    element.innerHTML = `<i class="mdi mdi-history"></i> ${note || t("dashboard.allHistory")}`;
    return;
  }

  const direction = metric.direction || "same";
  const icon = direction === "up"
    ? "mdi-arrow-up"
    : direction === "down"
      ? "mdi-arrow-down"
      : "mdi-minus";
  const value = metric.percent === null
    ? t("dashboard.new")
    : `${Math.abs(Number(metric.percent) || 0).toLocaleString(undefined, {
        maximumFractionDigits: 1
      })}%`;

  element.classList.add(direction);
  element.innerHTML = `<i class="mdi ${icon}"></i> ${value} vs ${resolvedLabel}`;
}

export function renderSummary(data = {}) {
  avgScope = data.avgPerDayScope === "year" ? "year" : "filter";
  applyAvgLabel();

  document.getElementById("hours").textContent = Number(data.totalMinutes || 0).toLocaleString();
  document.getElementById("plays").textContent = Number(data.totalPlays || 0).toLocaleString();
  document.getElementById("avg").textContent = Number(data.avgPerDay || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1
  });

  const comparisonLabel = data.comparison?.labelKey
    ? t(`comparison.${data.comparison.labelKey}`)
    : data.comparison?.label;
  const comparisonNote = data.comparisonNoteKey
    ? t(`comparison.${data.comparisonNoteKey}`)
    : data.comparisonNote;

  renderTrend(
    "hours-trend",
    data.comparison?.totalMinutes,
    comparisonLabel,
    comparisonNote
  );
  renderTrend(
    "plays-trend",
    data.comparison?.totalPlays,
    comparisonLabel,
    comparisonNote
  );
  renderTrend(
    "avg-trend",
    data.comparison?.avgPerDay,
    comparisonLabel,
    comparisonNote
  );
}

export async function loadSummary() {
  const data = await fetchJSON("/api/summary" + buildQuery());
  renderSummary(data);
}
