const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_PATTERN = /^(\d{4})-W(\d{1,2})$/;
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
