import { fetchJSON } from "./api.js";
import { t } from "./i18n.js";
import { buildQuery } from "./filters.js";

function renderTrend(elementId, metric, label, note) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.className = "metric-trend";

  if (!metric || !label) {
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
  element.innerHTML = `<i class="mdi ${icon}"></i> ${value} vs ${label}`;
}

export function renderSummary(data = {}) {
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
