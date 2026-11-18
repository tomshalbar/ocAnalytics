import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReadingChart } from "../src/features/area-details/reading-history/chart-data.ts";
import { createDateTimeFormatter } from "../src/time/date-time.ts";

const snapshot = (id, count, year, month, day = 1) => ({
  id,
  LastCount: count,
  // Local noon keeps calendar-month expectations independent of timezone.
  runDatetime: new Date(year, month - 1, day, 12).toISOString(),
});

test("month grouping follows the same timezone as displayed timestamps", () => {
  const readings = [
    { id: 1, LastCount: 4, runDatetime: "2026-11-01T00:30:00Z" },
  ];
  const chart = (timeZone) =>
    buildReadingChart(
      readings,
      createDateTimeFormatter({ locale: "en-US", timeZone }),
    );
  assert.equal(chart("America/Los_Angeles").months[0].key, "2026-10");
  assert.equal(chart("Asia/Tokyo").months[0].key, "2026-11");
});

test("fall-back keeps both repeated hours and spring-forward preserves chronological readings", () => {
  const local = createDateTimeFormatter({
    locale: "en-US",
    timeZone: "America/New_York",
  });
  for (const timestamps of [
    [
      "2026-11-01T01:15:00-04:00",
      "2026-11-01T01:45:00-04:00",
      "2026-11-01T01:30:00-05:00",
    ],
    [
      "2026-03-08T01:15:00-05:00",
      "2026-03-08T01:45:00-05:00",
      "2026-03-08T03:30:00-04:00",
    ],
  ]) {
    const readings = timestamps.map((runDatetime, id) => ({
      id,
      LastCount: id,
      runDatetime,
    }));
    const chart = buildReadingChart(readings.toReversed(), local);
    assert.deepEqual(
      chart.months[0].bars.map((bar) => bar.id),
      [0, 1, 2],
    );
    assert.notEqual(
      local.formatDateTime(timestamps[1]),
      local.formatDateTime(timestamps[2]),
    );
  }
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

test("keeps adjacent equal counts on the same calendar date as separate bars", () => {
  const first = snapshot(1, 12, 2026, 11, 5);
  const second = {
    ...snapshot(2, 12, 2026, 11, 5),
    runDatetime: new Date(2026, 10, 5, 13).toISOString(),
  };
  const third = {
    ...snapshot(3, 12, 2026, 11, 5),
    runDatetime: new Date(2026, 10, 5, 14).toISOString(),
  };
  const chart = buildReadingChart([third, first, second]);
  assert.deepEqual(chart.months[0].bars, [
    { id: first.id, count: 12, collectedAt: first.runDatetime },
    { id: second.id, count: 12, collectedAt: second.runDatetime },
    { id: third.id, count: 12, collectedAt: third.runDatetime },
  ]);
  assert.equal(chart.omittedCount, 0);
});

test("preserves individual readings within an hour and omits invalid counts", () => {
  const earlier = snapshot(1, 100, 2026, 11, 5);
  const later = {
    ...snapshot(2, 8, 2026, 11, 5),
    runDatetime: new Date(2026, 10, 5, 12, 45).toISOString(),
  };
  const invalid = {
    ...snapshot(3, null, 2026, 11, 5),
    runDatetime: new Date(2026, 10, 5, 12, 59).toISOString(),
  };
  const nextDay = snapshot(4, 8, 2026, 11, 6);
  const chart = buildReadingChart([nextDay, invalid, later, earlier]);
  assert.deepEqual(
    chart.months[0].bars.map((bar) => bar.id),
    [1, 2, 4],
  );
  assert.equal(chart.months[0].bars[1].collectedAt, later.runDatetime);
  assert.ok(chart.maximum >= 100);
  assert.equal(chart.omittedCount, 1);
});

test("selects only the newest 24 readings before plotting oldest to newest", () => {
  const readings = Array.from({ length: 30 }, (_, id) => ({
    id,
    LastCount: id < 6 ? 10000 : id,
    runDatetime: new Date(Date.UTC(2026, 10, 18, 12, id)).toISOString(),
  }));
  for (const input of [readings, readings.toReversed()]) {
    const chart = buildReadingChart(input);
    assert.deepEqual(
      chart.months.flatMap((group) => group.bars.map((bar) => bar.id)),
      Array.from({ length: 24 }, (_, index) => index + 6),
    );
    assert.ok(chart.maximum < 10000);
    assert.equal(chart.omittedCount, 0);
  }
});

test("ties use the newest IDs and missing counts do not pull in older readings", () => {
  const readings = Array.from({ length: 27 }, (_, id) => ({
    id,
    LastCount: id === 26 ? null : id,
    runDatetime: "2026-11-18T12:00:00Z",
  }));
  const chart = buildReadingChart(readings);
  assert.deepEqual(
    chart.months[0].bars.map((bar) => bar.id),
    Array.from({ length: 23 }, (_, index) => index + 3),
  );
  assert.equal(chart.omittedCount, 1);
});
