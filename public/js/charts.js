import { fetchJSON } from "./api.js";
import { buildQuery } from "./filters.js";
import { formatDay, formatWeek, formatMonth } from "./dates.js";

const state = {
  charts: {}
};

function replaceChart(canvasId, configuration) {
  if (state.charts[canvasId]) state.charts[canvasId].destroy();

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  state.charts[canvasId] = new Chart(canvas, configuration);
}

function commonOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index"
    },
    plugins: {
      legend: {
        labels: { color: "#b3b3b3" }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#8a8a8a", maxRotation: 0 }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.06)" },
        ticks: { color: "#8a8a8a", precision: 0 }
      }
    }
  };
}

export function renderDailyChart(data = []) {
  const options = commonOptions();
  options.scales.x.ticks.maxTicksLimit = 12;

  replaceChart("daily", {
    type: "bar",
    data: {
      labels: data.map(item => formatDay(item.day)),
      datasets: [{
        label: "Écoutes par jour",
        data: data.map(item => item.plays),
        backgroundColor: "rgba(255, 115, 2, 0.78)",
        borderRadius: 6,
        maxBarThickness: 50
      }]
    },
    options
  });
}

export function renderListeningClock(data = {}) {
  const hours = Array.isArray(data.hours) ? data.hours : [];
  const peakHour = Number.isInteger(data.peakHour) ? data.peakHour : null;
  const options = commonOptions();
  options.scales.x.ticks.maxTicksLimit = 12;
  options.plugins.legend.display = false;
  options.plugins.tooltip = {
    callbacks: {
      title(items) {
        const hour = Number(items[0]?.label?.slice(0, 2));
        if (!Number.isInteger(hour)) return items[0]?.label || "";
        return `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
      },
      label(item) {
        return `${Number(item.raw || 0).toLocaleString()} écoutes`;
      }
    }
  };

  replaceChart("listening-clock", {
    type: "bar",
    data: {
      labels: hours.map(item => item.label),
      datasets: [{
        data: hours.map(item => item.plays),
        backgroundColor: hours.map(item => (
          item.hour === peakHour ? "#ff7302" : "rgba(255, 115, 2, 0.3)"
        )),
        borderRadius: 6,
        maxBarThickness: 36
      }]
    },
    options
  });

  const peakElement = document.getElementById("peak-listening-hour");
  if (!peakElement) return;

  peakElement.textContent = peakHour === null
    ? "Aucune écoute sur cette période"
    : `Pic : ${String(peakHour).padStart(2, "0")}:00–${String((peakHour + 1) % 24).padStart(2, "0")}:00 heure locale · ${Number(data.peakPlays || 0).toLocaleString()} écoutes`;
}

export function renderWeeklyChart(data = []) {
  const options = commonOptions();
  options.scales.x.ticks.maxTicksLimit = 12;
  options.plugins.legend.display = false;

  replaceChart("weekly", {
    type: "bar",
    data: {
      labels: data.map(item => formatWeek(item.week)),
      datasets: [{
        label: "Écoutes par semaine",
        data: data.map(item => item.plays),
        backgroundColor: "rgba(255, 115, 2, 0.6)",
        borderRadius: 4,
        maxBarThickness: 20
      }]
    },
    options
  });
}

const EVOLUTION_COLORS = [
  "#ff7302",
  "#5ddc81",
  "#5ca8ff",
  "#ffd166",
  "#c792ea",
  "#ff6b8a"
];

export function renderArtistEvolution(evolution = {}) {
  const artists = Array.isArray(evolution.artists) ? evolution.artists : [];
  const months = Array.isArray(evolution.months) ? evolution.months : [];
  const series = Array.isArray(evolution.series) ? evolution.series : [];

  const playsByArtist = new Map(
    artists.map(artist => [
      artist,
      new Map(
        series
          .filter(row => row.artist === artist)
          .map(row => [row.month, Number(row.plays)])
      )
    ])
  );

  replaceChart("artists-evolution", {
    type: "line",
    data: {
      labels: months.map(month => formatMonth(month)),
      datasets: artists.map((artist, index) => ({
        label: artist,
        data: months.map(month => playsByArtist.get(artist)?.get(month) || 0),
        borderColor: EVOLUTION_COLORS[index % EVOLUTION_COLORS.length],
        backgroundColor: EVOLUTION_COLORS[index % EVOLUTION_COLORS.length],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false
      }))
    },
    options: commonOptions()
  });
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activityLevel(plays, max) {
  if (plays <= 0) return 0;
  return Math.min(4, Math.ceil((plays / max) * 4));
}

export function renderActivityHeatmap(days = []) {
  const container = document.getElementById("activity-heatmap");
  if (!container) return;

  const playsByDay = new Map(days.map(item => [item.day, Number(item.plays)]));
  const maxPlays = Math.max(1, ...days.map(item => Number(item.plays)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekdayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - weekdayOffset - 52 * 7);

  let html = "";
  for (let week = 0; week < 53; week++) {
    html += '<div class="heatmap-col">';
    for (let weekday = 0; weekday < 7; weekday++) {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + week * 7 + weekday);

      if (cellDate > today) {
        html += '<div class="heatmap-cell heatmap-future"></div>';
        continue;
      }

      const key = localDateKey(cellDate);
      const plays = playsByDay.get(key) || 0;
      const level = activityLevel(plays, maxPlays);
      html += `<div class="heatmap-cell level-${level}" title="${formatDay(key)} · ${plays.toLocaleString()} écoutes"></div>`;
    }
    html += "</div>";
  }

  container.innerHTML = html;
}

export async function loadChart({ url, canvasId, labelKey, valueKey, label }) {
  const data = await fetchJSON(`${url}${buildQuery()}`);

  if (canvasId === "daily") {
    renderDailyChart(data);
    return;
  }

  replaceChart(canvasId, {
    type: "bar",
    data: {
      labels: data.map(item => item[labelKey]),
      datasets: [{
        label,
        data: data.map(item => item[valueKey]),
        backgroundColor: "#ff7302",
        borderRadius: 6,
        maxBarThickness: 50
      }]
    },
    options: commonOptions()
  });
}
