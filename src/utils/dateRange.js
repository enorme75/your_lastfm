function parseTimezoneOffset(raw) {
  if (raw === undefined || raw === null || raw === "") return 0;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < -840 || parsed > 840) return 0;

  return parsed;
}

function getLocalDayStart(referenceDate, timezoneOffset) {
  const shifted = new Date(referenceDate.getTime() - timezoneOffset * 60000);
  return new Date(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  ) + timezoneOffset * 60000);
}

function shiftLocalDays(referenceDate, timezoneOffset, days) {
  const dayStart = getLocalDayStart(referenceDate, timezoneOffset);
  const shifted = new Date(dayStart.getTime() - timezoneOffset * 60000);
  return new Date(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + days
  ) + timezoneOffset * 60000);
}

function getLocalDayKey(referenceDate, timezoneOffset) {
  return new Date(referenceDate.getTime() - timezoneOffset * 60000)
    .toISOString()
    .slice(0, 10);
}

function getLocalDayModifier(timezoneOffset) {
  if (!timezoneOffset) return null;

  const minutes = -timezoneOffset;
  return `${minutes > 0 ? "+" : "-"}${Math.abs(minutes)} minutes`;
}

function getLocalYearToDate(timezoneOffset, referenceDate = new Date()) {
  const now = new Date(referenceDate);
  const shifted = new Date(now.getTime() - timezoneOffset * 60000);
  const year = shifted.getUTCFullYear();

  const currentFrom = new Date(Date.UTC(year, 0, 1) + timezoneOffset * 60000);
  const daysElapsed = Math.floor((now.getTime() - currentFrom.getTime()) / 86400000) + 1;
  const previousFrom = new Date(Date.UTC(year - 1, 0, 1) + timezoneOffset * 60000);
  const previousTo = new Date(Date.UTC(year - 1, 0, daysElapsed + 1) + timezoneOffset * 60000 - 1);

  return {
    year,
    daysElapsed,
    current: { from: currentFrom, to: now },
    previous: { from: previousFrom, to: previousTo }
  };
}

function getDateRange(range, year, month, referenceDate = new Date(), timezoneOffset = 0) {
  const now = new Date(referenceDate);

  if (range) {
    const from = new Date(now);

    switch (range) {
      case "day":
        from.setTime(getLocalDayStart(now, timezoneOffset).getTime());
        break;
      case "week":
        from.setUTCDate(from.getUTCDate() - 7);
        break;
      case "month":
        from.setUTCMonth(from.getUTCMonth() - 1);
        break;
      case "year":
        from.setUTCFullYear(from.getUTCFullYear() - 1);
        break;
      default:
        return { from: null, to: null };
    }

    return { from, to: now };
  }

  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isInteger(parsedYear) || parsedYear < 1970 || parsedYear > 9999) {
    return { from: null, to: null };
  }

  const parsedMonth = month === undefined || month === null || month === ""
    ? null
    : Number.parseInt(month, 10);

  if (parsedMonth !== null && (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
    return { from: null, to: null };
  }

  const from = parsedMonth === null
    ? new Date(Date.UTC(parsedYear, 0, 1))
    : new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));

  const to = parsedMonth === null
    ? new Date(Date.UTC(parsedYear + 1, 0, 1) - 1)
    : new Date(Date.UTC(parsedYear, parsedMonth, 1) - 1);

  return { from, to };
}

function fillMissingDates(rows, range, year, month, timezoneOffset = 0, referenceDate = new Date()) {
  const { from, to } = getDateRange(range, year, month, referenceDate, timezoneOffset);
  if (!from || !to) return rows;

  const shiftMs = timezoneOffset * 60000;
  const shiftedFrom = new Date(from.getTime() - shiftMs);
  const shiftedTo = new Date(to.getTime() - shiftMs);

  const result = new Map();
  const current = new Date(Date.UTC(
    shiftedFrom.getUTCFullYear(),
    shiftedFrom.getUTCMonth(),
    shiftedFrom.getUTCDate()
  ));
  const lastDay = new Date(Date.UTC(
    shiftedTo.getUTCFullYear(),
    shiftedTo.getUTCMonth(),
    shiftedTo.getUTCDate()
  ));

  while (current <= lastDay) {
    const day = current.toISOString().slice(0, 10);
    result.set(day, { day, plays: 0 });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  for (const row of rows) {
    if (result.has(row.day)) result.set(row.day, row);
  }

  return Array.from(result.values());
}

module.exports = {
  getDateRange,
  fillMissingDates,
  parseTimezoneOffset,
  getLocalDayStart,
  shiftLocalDays,
  getLocalDayKey,
  getLocalDayModifier,
  getLocalYearToDate
};
