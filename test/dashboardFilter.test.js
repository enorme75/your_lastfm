const test = require("node:test");
const assert = require("node:assert/strict");

const { getDashboardFilterContext, getTimezoneOffset } = require("../src/utils/dashboardFilter");

test("builds the previous equivalent rolling window", () => {
  const context = getDashboardFilterContext(
    { range: "week", tzOffset: "180" },
    new Date("2026-08-02T22:00:00.000Z")
  );

  assert.deepEqual(context.current.params, [1785103200, 1785708000]);
  assert.deepEqual(context.previous.params, [1784498400, 1785103199]);
  assert.equal(context.comparisonLabel, "7 derniers jours");
  assert.equal(context.timezoneOffset, 180);
});

test("builds a since-local-midnight day compared with yesterday", () => {
  const context = getDashboardFilterContext(
    { range: "day", tzOffset: "-60" },
    new Date("2026-08-03T10:30:00.000Z")
  );

  assert.deepEqual(context.current.params, [1785711600, 1785753000]);
  assert.deepEqual(context.previous.params, [1785625200, 1785711599]);
  assert.equal(context.comparisonLabel, "hier");
  assert.equal(context.comparisonLabelKey, "yesterday");
  assert.ok(context.cacheKey.includes("day=2026-08-03"), context.cacheKey);
});

test("builds a rolling 30-day window with its previous equivalent", () => {
  const reference = new Date("2026-08-02T22:00:00.000Z");
  const context = getDashboardFilterContext({ range: "30days", tzOffset: "0" }, reference);

  assert.equal(context.current.params[0], 1783116000);
  assert.equal(
    context.current.params[1],
    Math.floor(reference.getTime() / 1000)
  );
  assert.equal(context.previous.params[0], context.current.params[0] - 30 * 86400);
  assert.equal(context.comparisonLabel, "30 jours précédents");
  assert.equal(context.comparisonLabelKey, "previous30d");
});

test("compares a selected month with the previous calendar month", () => {
  const context = getDashboardFilterContext({ year: "2026", month: "3" });

  assert.deepEqual(context.current.params, [1772323200, 1775001599]);
  assert.deepEqual(context.previous.params, [1769904000, 1772323199]);
  assert.equal(context.comparisonLabel, "mois précédent");
});

test("does not invent a previous period for all-time or month-only filters", () => {
  assert.equal(getDashboardFilterContext({}).previous, null);
  assert.equal(getDashboardFilterContext({ month: "2" }).previous, null);
});

test("validates browser timezone offsets", () => {
  assert.equal(getTimezoneOffset({ tzOffset: "-330" }), -330);
  assert.throws(
    () => getTimezoneOffset({ tzOffset: "9999" }),
    error => error.statusCode === 400
  );
});
