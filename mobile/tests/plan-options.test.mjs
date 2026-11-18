import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPlanOptions,
  filterPlanOptions,
} from "../src/features/plan/plan-options.ts";

const time = (day, hour) => new Date(2026, 10, day, hour).toISOString();
const now = Date.parse(time(18, 8));
const point = (day, hour, median) => ({
  timestamp: time(day, hour),
  median,
  lower: Math.max(0, median - 1),
  upper: median + 1,
});
const forecast = (location_id, points, used_fallback = false) => ({
  location_id,
  model: "test-model",
  used_fallback,
  generated_at: time(18, 7),
  data_through: time(18, 6),
  forecast: points,
});

test("selects the lowest future hour per local day, preserving zero and earliest ties", () => {
  const options = buildPlanOptions(
    [
      forecast(1, [
        point(18, 7, 0),
        point(18, 8, 0),
        point(18, 9, 4),
        point(18, 12, 0),
        point(18, 11, 0),
        point(19, 0, 8),
        point(19, 9, 3),
      ]),
    ],
    now,
  );
  assert.equal(options.length, 2);
  assert.equal(options[0].timestamp, Date.parse(time(18, 11)));
  assert.equal(options[0].predictedOccupancy, 0);
  assert.equal(options[0].dayKey, "2026-11-18");
  assert.equal(options[1].timestamp, Date.parse(time(19, 9)));
  assert.equal(options[1].dayKey, "2026-11-19");
  assert.match(options[0].recommendation.reason, /Predicted 0 people/);
});

test("ranks unrounded counts across locations and retains fallback attribution", () => {
  const options = buildPlanOptions(
    [
      forecast(1, [point(18, 9, 2.4)]),
      forecast(2, [point(18, 10, 2.1)], true),
      forecast(3, [point(18, 11, 2.1)]),
    ],
    now,
  );
  assert.deepEqual(
    options.map((o) => o.locationId),
    ["2", "3", "1"],
  );
  assert.match(
    options[0].recommendation.reason,
    /Baseline forecast \(fallback\)/,
  );
  assert.match(options[2].recommendation.reason, /Model: test-model/);
  assert.deepEqual(buildPlanOptions([], now), []);
  assert.deepEqual(buildPlanOptions([forecast(1, [point(18, 7, 0)])], now), []);
});

test("combines location and weekday filters, excluding removed locations", () => {
  const options = buildPlanOptions(
    [
      forecast(1, [point(18, 9, 1), point(19, 9, 2)]),
      forecast(2, [point(18, 9, 0)]),
    ],
    now,
  );
  const locations = [{ LocationId: 1 }, { LocationId: 2 }];
  assert.equal(filterPlanOptions(options, locations, "all", "all").length, 3);
  const filtered = filterPlanOptions(options, locations, "1", "Thursday");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].locationId, "1");
  assert.equal(filtered[0].dayKey, "2026-11-19");
  assert.equal(filterPlanOptions(options, [], "all", "all").length, 0);
  assert.equal(
    filterPlanOptions(options, locations, "2", "Thursday").length,
    0,
  );
});
