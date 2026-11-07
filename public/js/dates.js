const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_PATTERN = /^(\d{4})-W?(\d{1,2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function formatDay(day) {
  const match = DAY_PATTERN.exec(String(day || ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(day || "");
}

export function formatWeek(week) {
  const match = WEEK_PATTERN.exec(String(week || ""));
  return match ? `S${Number(match[2])}/${match[1]}` : String(week || "");
}

export function formatMonth(month) {
  const match = MONTH_PATTERN.exec(String(month || ""));
  return match ? `${match[2]}/${match[1]}` : String(month || "");
}

export function formatTimestampDate(timestampMs) {
  const date = new Date(Number(timestampMs));
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function formatTimestampDateTime(timestampMs) {
  const date = new Date(Number(timestampMs));
  if (Number.isNaN(date.getTime())) return "";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${formatTimestampDate(date.getTime())} ${time}`;
}

// =========================
//   FENÊTRES DE PÉRIODE (UTC, cohérent avec strftime SQLite sur unixepoch)
// =========================

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDayWindow(day) {
  const match = DAY_PATTERN.exec(String(day || ""));
  if (!match) return null;

  const from = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return { from, to: from + DAY_MS - 1, key: String(day) };
}

// SQLite strftime('%Y-%W') : semaines calendaires lundi-dimanche,
// semaine 01 = celle du premier lundi de l'année, 00 = jours qui précèdent.
export function getWeekWindow(week) {
  const match = WEEK_PATTERN.exec(String(week || ""));
  if (!match) return null;

  const year = Number(match[1]);
  const weekNumber = Number(match[2]);
  const jan1 = Date.UTC(year, 0, 1);
  const jan1Dow = new Date(jan1).getUTCDay();
  const offsetToFirstMonday = jan1Dow === 1 ? 0 : (jan1Dow === 0 ? 1 : 8 - jan1Dow);
  const firstMonday = jan1 + offsetToFirstMonday * DAY_MS;
  const from = weekNumber === 0 ? jan1 : firstMonday + (weekNumber - 1) * 7 * DAY_MS;
  const to = weekNumber === 0 ? firstMonday - 1 : from + 7 * DAY_MS - 1;

  return { from, to, key: String(week) };
}

export function getMonthWindow(month) {
  const match = MONTH_PATTERN.exec(String(month || ""));
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const from = Date.UTC(year, monthIndex, 1);

  return { from, to: Date.UTC(year, monthIndex + 1, 1) - 1, key: String(month) };
}

export function getYearWindow(year) {
  const parsed = Number.parseInt(String(year || ""), 10);
  if (!Number.isInteger(parsed)) return null;

  const from = Date.UTC(parsed, 0, 1);

  return { from, to: Date.UTC(parsed + 1, 0, 1) - 1, key: String(parsed) };
}

// Les fenêtres de période sont en UTC (strftime SQLite sur unixepoch) :
// formater en UTC évite que les bornes glissent au jour suivant en heure locale.
export function formatDayShort(timestampMs, localeTag = "fr-FR") {
  const date = new Date(Number(timestampMs));
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(localeTag, { day: "numeric", month: "short", timeZone: "UTC" })
    .format(date)
    .replace(/\s/g, " ")
    .trim();
}

export function formatWeekRange(week, localeTag = "fr-FR") {
  const window = getWeekWindow(week);
  if (!window) return String(week || "");

  return `${formatDayShort(window.from, localeTag)} – ${formatDayShort(window.to, localeTag)}`;
}
