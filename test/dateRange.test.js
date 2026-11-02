const test = require("node:test");
const assert = require("node:assert/strict");

const { getDateRange, fillMissingDates, getLocalYearToDate } = require("../src/utils/dateRange");
const { getActiveFilter } = require("../src/utils/filters");

test("builds an indexed UTC range for a month", () => {
  const { from, to } = getDateRange(null, "2026", "2");

  assert.equal(from.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(to.toISOString(), "2026-02-28T23:59:59.999Z");

  const filter = getActiveFilter({ year: "2026", month: "2" });
  assert.equal(filter.where, "played_at >= ? AND played_at <= ?");
  assert.deepEqual(filter.params, [
    Math.floor(from.getTime() / 1000),
    Math.floor(to.getTime() / 1000)
  ]);
});

test("rejects invalid year and month filters", () => {
  assert.throws(
    () => getActiveFilter({ year: "abc", month: "2" }),
    error => error.statusCode === 400
  );
  assert.throws(
    () => getActiveFilter({ year: "2026", month: "13" }),
    error => error.statusCode === 400
  );
  assert.throws(
    () => getActiveFilter({ range: "forever" }),
    error => error.statusCode === 400
  );
});

test("supports a month filter across all years", () => {
  assert.deepEqual(getActiveFilter({ month: "2" }), {
    where: "strftime('%m', played_at, 'unixepoch') = ?",
    params: ["02"]
  });
});

test("builds a since-local-midnight range for the day filter", () => {
  const now = new Date("2026-08-03T10:30:00.000Z");

  const paris = getDateRange("day", null, null, now, -60);
  assert.equal(paris.from.toISOString(), "2026-08-02T23:00:00.000Z");
  assert.equal(paris.to.toISOString(), now.toISOString());

  const utc = getDateRange("day", null, null, now, 0);
  assert.equal(utc.from.toISOString(), "2026-08-03T00:00:00.000Z");
  assert.equal(utc.to.toISOString(), now.toISOString());
});

test("rolls the day range over at local midnight", () => {
  const beforeMidnight = new Date("2026-08-03T22:59:59.000Z");
  const afterMidnight = new Date("2026-08-03T23:00:00.000Z");

  const before = getDateRange("day", null, null, beforeMidnight, -60);
  const after = getDateRange("day", null, null, afterMidnight, -60);

  assert.equal(before.from.toISOString(), "2026-08-02T23:00:00.000Z");
  assert.equal(after.from.toISOString(), "2026-08-03T23:00:00.000Z");
});

test("fills only the current local day for the day range", () => {
  const result = fillMissingDates(
    [{ day: "2026-08-03", plays: 4 }],
    "day",
    "",
    "",
    -60,
    new Date("2026-08-03T10:30:00.000Z")
  );

  assert.deepEqual(result, [{ day: "2026-08-03", plays: 4 }]);
});

test("builds a year-to-date window anchored on local January 1st", () => {
  const ytd = getLocalYearToDate(-60, new Date("2026-11-02T22:32:00.000Z"));

  assert.equal(ytd.year, 2026);
  assert.equal(ytd.daysElapsed, 306);
  assert.equal(ytd.current.from.toISOString(), "2025-12-31T23:00:00.000Z");
  assert.equal(ytd.current.to.toISOString(), "2026-11-02T22:32:00.000Z");
  assert.equal(ytd.previous.from.toISOString(), "2024-12-31T23:00:00.000Z");
  assert.equal(ytd.previous.to.toISOString(), "2025-11-02T22:59:59.999Z");
});

test("fills missing dates without local timezone drift", () => {
  const result = fillMissingDates(
    [{ day: "2024-02-29", plays: 3 }],
    null,
    "2024",
    "2"
  );

  assert.equal(result.length, 29);
  assert.deepEqual(result[0], { day: "2024-02-01", plays: 0 });
  assert.deepEqual(result.at(-1), { day: "2024-02-29", plays: 3 });
});
