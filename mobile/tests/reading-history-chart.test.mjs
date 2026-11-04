import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReadingChart } from "../src/features/area-details/reading-history/chart-data.ts";

const snapshot = (id, count, year, month, day = 1) => ({
  id,
  LastCount: count,
  // Local noon keeps calendar-month expectations independent of timezone.
  runDatetime: new Date(year, month - 1, day, 12).toISOString(),
});

test("keeps every count in chronological order with one label per month", () => {
  const readings = [
    snapshot(3, 8, 2026, 11, 3),
    snapshot(1, 2, 2026, 10, 31),
    snapshot(2, 0, 2026, 11, 1),
  ];
  const chart = buildReadingChart(readings);
  assert.deepEqual(
    chart.months.map((group) => group.month),
    [10, 11],
  );
  assert.deepEqual(
    chart.months[1].bars.map((bar) => bar.count),
    [0, 8],
  );
  assert.deepEqual(
    readings.map((reading) => reading.id),
    [3, 1, 2],
  );
  assert.equal(chart.omittedCount, 0);
});

test("missing and invalid counts are omitted rather than plotted as zero", () => {
  const readings = [null, -1, NaN, Infinity, 0].map((count, index) =>
    snapshot(index, count, 2026, 11),
  );
  const chart = buildReadingChart(readings);
  assert.equal(chart.omittedCount, 4);
  assert.equal(chart.months[0].bars.length, 1);
  assert.equal(chart.months[0].bars[0].count, 0);
  assert.ok(chart.maximum > 0);
});

test("count axis starts at zero and covers the largest reported value", () => {
  for (const count of [0, 1, 7, 21, 137, 1000]) {
    const chart = buildReadingChart([snapshot(1, count, 2026, 11)]);
    assert.ok(chart.maximum >= count);
    assert.equal(chart.ticks.at(-1), 0);
    assert.ok(chart.ticks.every(Number.isInteger));
    assert.equal(new Set(chart.ticks).size, 5);
  }
  assert.deepEqual(buildReadingChart([]).months, []);
});
