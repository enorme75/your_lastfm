import { fetchJSON } from "./api.js";
import {
  renderActivityHeatmap,
  renderWeeklyChart,
  renderArtistEvolution
} from "./charts.js";

export async function loadInsights() {
  try {
    const tzOffset = new Date().getTimezoneOffset();
    const data = await fetchJSON(`/api/insights?tzOffset=${tzOffset}`, {
      cache: "no-store"
    });

    renderActivityHeatmap(data.activityCalendar);
    renderWeeklyChart(data.playsPerWeek);
    renderArtistEvolution(data.artistEvolution);
  } catch (error) {
    console.error("Error loading insights:", error);
  }
}
