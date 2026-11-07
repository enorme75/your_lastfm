const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateChange, normalizeSummary } = require("../src/utils/dashboardMetrics");

test("calculates dashboard trend percentages", () => {
  assert.deepEqual(calculateChange(120, 100), {
    previous: 100,
    percent: 20,
    direction: "up"
  });
  assert.deepEqual(calculateChange(75, 100), {
    previous: 100,
    percent: -25,
    direction: "down"
  });
  assert.deepEqual(calculateChange(10, 0), {
    previous: 0,
    percent: null,
    direction: "up"
  });
});

test("normalizes summary rows into display values", () => {
  assert.deepEqual(
    normalizeSummary({ totalPlays: 21, totalArtists: 7, totalSeconds: 3600, days: 3 }),
    {
      totalPlays: 21,
      totalArtists: 7,
      totalMinutes: 60,
      avgPerDay: 7
    }
  );
  assert.deepEqual(normalizeSummary({}), {
    totalPlays: 0,
    totalArtists: 0,
    totalMinutes: 0,
    avgPerDay: 0
  });
});
