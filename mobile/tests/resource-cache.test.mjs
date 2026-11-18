import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CachedResource,
  getCachedResource,
  REFRESH_INTERVAL_MS,
} from "../src/data/api/resource-cache.ts";

test("screen remounts share data and in-flight requests", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  let calls = 0;
  let resolve;
  const load = () => {
    calls++;
    return new Promise((done) => {
      resolve = done;
    });
  };
  const first = getCachedResource("shared-test", load, 15000);
  const unsubscribe = first.subscribe(() => {});
  const pending = first.refresh();
  await Promise.resolve();
  unsubscribe();
  const second = getCachedResource("shared-test", load, 15000);
  assert.equal(first, second);
  second.ensureLoaded();
  assert.equal(second.refresh(), pending);
  assert.equal(calls, 1);
  resolve(["reading"]);
  await pending;
  second.ensureLoaded();
  assert.equal(calls, 1);
  assert.deepEqual(second.getSnapshot().data, ["reading"]);
});

test("automatic refresh waits ten minutes and manual refresh resets the timer", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  let calls = 0;
  const resource = new CachedResource(async () => ++calls, 15000);
  await resource.refresh();
  t.mock.timers.tick(REFRESH_INTERVAL_MS - 1);
  assert.equal(calls, 1);
  await resource.refresh();
  assert.equal(calls, 2);
  t.mock.timers.tick(REFRESH_INTERVAL_MS - 1);
  assert.equal(calls, 2);
  t.mock.timers.tick(1);
  await resource.refresh();
  assert.equal(calls, 3);
  assert.equal(resource.getSnapshot().data, 3);
});

test("cached readings remain visible during refresh and after a failed refresh", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  let fail = false;
  const resource = new CachedResource(async () => {
    if (fail) throw new Error("Offline");
    return ["cached"];
  }, 15000);
  await resource.refresh();
  fail = true;
  const refresh = resource.refresh();
  assert.equal(resource.getSnapshot().loading, true);
  assert.deepEqual(resource.getSnapshot().data, ["cached"]);
  await refresh;
  assert.deepEqual(resource.getSnapshot().data, ["cached"]);
  assert.equal(resource.getSnapshot().error, "Offline");
  resource.ensureLoaded();
  assert.equal(resource.getSnapshot().loading, false);
});

test("resuming the app refreshes only resources past the ten-minute deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let calls = 0;
  const resource = new CachedResource(async () => ++calls, 15000);
  await resource.refresh();
  t.mock.timers.setTime(REFRESH_INTERVAL_MS - 1);
  resource.refreshIfDue();
  assert.equal(calls, 1);
  t.mock.timers.setTime(REFRESH_INTERVAL_MS);
  resource.refreshIfDue();
  await resource.refresh();
  assert.equal(calls, 2);
});
