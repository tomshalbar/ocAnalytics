import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRecentLocationReadings,
  recentReadingsCacheKey,
} from "../src/data/api/locations.ts";
import { getCachedResource } from "../src/data/api/resource-cache.ts";

test("24-reading requests do not reuse the old 12-reading cache entry", () => {
  const load = async () => [];
  const old = getCachedResource("history:3367:recent", load, 1000);
  const current = getCachedResource(recentReadingsCacheKey("3367"), load, 1000);
  assert.notEqual(current, old);
  assert.match(recentReadingsCacheKey("3367"), /:limit:24$/);
  assert.equal(
    current,
    getCachedResource(recentReadingsCacheKey("3367"), load, 1000),
  );
});

const reading = (id, runDatetime) => ({
  id,
  LocationId: 3367,
  FacilityId: null,
  CountOfParticipants: null,
  PercetageCapacity: null,
  LastCount: id,
  IsClosed: false,
  LastUpdatedDateAndTime: null,
  runDatetime,
  is_stale: true,
  collection_is_stale: false,
});

test("frontend selects recent readings using only existing endpoints", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = "https://example.test";
  const signal = new AbortController().signal;
  const mockHistory = (rows, requestedSignal = signal) => {
    const requests = [];
    globalThis.fetch = async (url, options) => {
      assert.equal(options.signal, requestedSignal);
      const request = new URL(url);
      requests.push(request);
      if (request.pathname === "/locations/3367/latest") {
        return { ok: true, json: async () => rows.at(-1) };
      }
      assert.equal(request.pathname, "/locations/3367/history");
      const start = Date.parse(request.searchParams.get("start"));
      const end = Date.parse(request.searchParams.get("end"));
      assert.ok(end - start <= 31 * 86_400_000);
      const offset = Number(request.searchParams.get("offset"));
      const limit = Number(request.searchParams.get("limit"));
      const matching = rows.filter((row) => {
        const timestamp = Date.parse(row.runDatetime);
        return timestamp >= start && timestamp < end;
      });
      return {
        ok: true,
        json: async () => matching.slice(offset, offset + limit),
      };
    };
    return requests;
  };
  try {
    await t.test(
      "finishes oldest-first pages before choosing the newest 24",
      async () => {
        const rows = Array.from({ length: 1015 }, (_, id) =>
          reading(id, new Date(Date.UTC(2026, 10, 18, 0, 0, id)).toISOString()),
        );
        const requests = mockHistory(rows);
        const result = await getRecentLocationReadings("3367", signal);
        assert.deepEqual(
          result.map((row) => row.id),
          Array.from({ length: 24 }, (_, i) => 1014 - i),
        );
        assert.equal(requests.length, 3);
        assert.equal(requests.at(-1).searchParams.get("offset"), "1000");
        assert.ok(
          Date.parse(requests.at(-1).searchParams.get("end")) >
            Date.parse(rows.at(-1).runDatetime),
        );
      },
    );
    await t.test(
      "backfills older windows without losing readings at boundaries",
      async () => {
        const rows = Array.from({ length: 30 }, (_, id) =>
          reading(id, new Date(Date.UTC(2025, 0, id + 1, 12)).toISOString()),
        );
        const requests = mockHistory(rows);
        const result = await getRecentLocationReadings("3367", signal);
        assert.deepEqual(
          result.map((row) => row.id),
          Array.from({ length: 24 }, (_, i) => 29 - i),
        );
        assert.ok(requests.length > 2);
        assert.equal(new Set(result.map((row) => row.id)).size, 24);
      },
    );
    await t.test(
      "returns fewer readings when history is exhausted",
      async () => {
        const rows = [reading(1, "1970-01-02T12:00:00Z")];
        mockHistory(rows);
        assert.deepEqual(await getRecentLocationReadings("3367", signal), rows);
      },
    );
    await t.test("validates history responses and location IDs", async () => {
      const rows = Array.from({ length: 12 }, (_, id) =>
        reading(id, "2026-11-18T12:00:00Z"),
      );
      const requests = mockHistory(rows);
      const validFetch = globalThis.fetch;
      globalThis.fetch = async (url, options) =>
        url.includes("/history?")
          ? { ok: true, json: async () => [{ ...rows[0], LocationId: 42 }] }
          : validFetch(url, options);
      await assert.rejects(
        getRecentLocationReadings("3367", signal),
        /unexpected response/,
      );
      const count = requests.length;
      await assert.rejects(
        getRecentLocationReadings("invalid", signal),
        (error) => error.status === 404,
      );
      assert.equal(requests.length, count);
    });
    await t.test(
      "cancels backfill instead of starting additional windows",
      async () => {
        const controller = new AbortController();
        const requests = mockHistory(
          [reading(1, "2026-11-18T12:00:00Z")],
          controller.signal,
        );
        const validFetch = globalThis.fetch;
        globalThis.fetch = async (url, options) => {
          const response = await validFetch(url, options);
          if (url.includes("/history?")) controller.abort();
          return response;
        };
        await assert.rejects(
          getRecentLocationReadings("3367", controller.signal),
          { name: "AbortError" },
        );
        assert.equal(requests.length, 2);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
  }
});
