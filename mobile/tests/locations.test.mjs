import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRequestTimeoutMs,
  ApiError,
  getLocations,
  readingStatus,
  formatReadingTime,
  checkBackendConnection,
  getLocationHistory,
  getLocationStatistics,
} from "../src/data/api/locations.ts";

const reading = {
  id: 1,
  LocationId: 3367,
  FacilityId: 596,
  CountOfParticipants: 0,
  PercetageCapacity: 0,
  LastCount: 12,
  IsClosed: false,
  LastUpdatedDateAndTime: "2026-10-18T12:00:00Z",
  runDatetime: "2026-10-18T12:01:00Z",
  is_stale: false,
  collection_is_stale: false,
};

test("API client contract and failure handling", async (t) => {
  const signal = new AbortController().signal;
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  try {
    await t.test("missing configuration is actionable", async () => {
      delete process.env.EXPO_PUBLIC_API_URL;
      await assert.rejects(
        getLocations(undefined, signal),
        /EXPO_PUBLIC_API_URL/,
      );
    });
    process.env.EXPO_PUBLIC_API_URL = "http://example.test/";
    await t.test(
      "connection check only calls the health endpoint",
      async () => {
        globalThis.fetch = async (url, options) => {
          assert.equal(url, "http://example.test/");
          assert.equal(options.signal, signal);
          return {
            ok: true,
            json: async () => ({
              message: "Open Court Analytics API is running",
            }),
          };
        };
        assert.equal(await checkBackendConnection(signal), undefined);
      },
    );
    await t.test(
      "health check validates server identity and failure responses",
      async () => {
        for (const data of [null, {}, [], { message: "Another server" }]) {
          globalThis.fetch = async () => ({ ok: true, json: async () => data });
          await assert.rejects(
            checkBackendConnection(signal),
            /unexpected health response/,
          );
        }
        globalThis.fetch = async () => ({
          ok: true,
          json: async () => {
            throw new SyntaxError();
          },
        });
        await assert.rejects(
          checkBackendConnection(signal),
          /unexpected health response/,
        );
        globalThis.fetch = async () => ({ ok: false, status: 503 });
        await assert.rejects(
          checkBackendConnection(signal),
          (error) => error instanceof ApiError && error.status === 503,
        );
        globalThis.fetch = async () => {
          throw new Error("network");
        };
        await assert.rejects(
          checkBackendConnection(signal),
          /Cannot reach the backend/,
        );
      },
    );
    await t.test("list URL and cancellation signal", async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, "http://example.test/locations/latest");
        assert.equal(options.signal, signal);
        return { ok: true, json: async () => [reading] };
      };
      assert.deepEqual(await getLocations(undefined, signal), [reading]);
    });
    await t.test("single result has consistent list shape", async () => {
      globalThis.fetch = async (url) => {
        assert.equal(url, "http://example.test/locations/3367/latest");
        return { ok: true, json: async () => reading };
      };
      assert.deepEqual(await getLocations("3367", signal), [reading]);
    });
    await t.test("rejects frontend slugs before fetching", async () => {
      globalThis.fetch = async () => {
        assert.fail("must not fetch");
      };
      await assert.rejects(
        getLocations("southwest-tennis", signal),
        (e) => e.status === 404,
      );
    });
    await t.test("empty list remains empty", async () => {
      globalThis.fetch = async () => ({ ok: true, json: async () => [] });
      assert.deepEqual(await getLocations(undefined, signal), []);
    });
    await t.test("invalid response is rejected", async () => {
      for (const data of [
        null,
        {},
        [{ LocationId: 1 }],
        [{ ...reading, runDatetime: "bad date" }],
      ]) {
        globalThis.fetch = async () => ({ ok: true, json: async () => data });
        await assert.rejects(
          getLocations(undefined, signal),
          /unexpected response/,
        );
      }
    });
    await t.test("404 and 503 preserve status with safe messages", async () => {
      for (const status of [404, 503]) {
        globalThis.fetch = async () => ({ ok: false, status });
        await assert.rejects(
          getLocations("3367", signal),
          (e) => e instanceof ApiError && e.status === status,
        );
      }
    });
    await t.test("network failures become readable errors", async () => {
      globalThis.fetch = async () => {
        throw Error("network internals");
      };
      await assert.rejects(
        getLocations(undefined, signal),
        /Cannot reach the backend/,
      );
    });
    const range = {
      start: "2026-10-18T00:00:00Z",
      end: "2026-10-19T00:00:00Z",
    };
    await t.test(
      "history sends encoded bounds and pagination, preserves rows and empty pages",
      async () => {
        const second = { ...reading, id: 2, LastCount: null };
        globalThis.fetch = async (url, options) => {
          const parsed = new URL(url);
          assert.equal(parsed.pathname, "/locations/3367/history");
          assert.equal(parsed.searchParams.get("start"), range.start);
          assert.equal(parsed.searchParams.get("end"), range.end);
          assert.equal(parsed.searchParams.get("limit"), "50");
          assert.equal(parsed.searchParams.get("offset"), "100");
          assert.equal(options.signal, signal);
          return { ok: true, json: async () => [reading, second] };
        };
        assert.deepEqual(
          await getLocationHistory(
            "3367",
            { ...range, limit: 50, offset: 100 },
            signal,
          ),
          [reading, second],
        );
        globalThis.fetch = async () => ({ ok: true, json: async () => [] });
        assert.deepEqual(await getLocationHistory("3367", range, signal), []);
      },
    );
    await t.test(
      "history rejects invalid pages and time ranges before requesting",
      async () => {
        globalThis.fetch = async () => assert.fail("must not fetch");
        for (const query of [
          { ...range, limit: 0 },
          { ...range, limit: 1001 },
          { ...range, offset: -1 },
          { ...range, offset: 100001 },
          { ...range, start: range.end },
          { ...range, start: "2026-10-18T00:00:00" },
          { ...range, end: "2026-12-19T00:00:00Z" },
        ])
          await assert.rejects(
            getLocationHistory("3367", query, signal),
            ApiError,
          );
      },
    );
    await t.test(
      "history rejects invalid and cross-location responses",
      async () => {
        for (const data of [
          {},
          [{ ...reading, LocationId: 999 }],
          [{ ...reading, runDatetime: "invalid" }],
        ]) {
          globalThis.fetch = async () => ({ ok: true, json: async () => data });
          await assert.rejects(
            getLocationHistory("3367", range, signal),
            /unexpected response/,
          );
        }
      },
    );
    await t.test(
      "statistics preserves counts and represents 404 as an empty summary",
      async () => {
        const response = {
          location_id: 3367,
          ...range,
          statistics: {
            total_readings: 5,
            average_count: 2.4,
            minimum_count: 0,
            maximum_count: null,
          },
        };
        globalThis.fetch = async (url, options) => {
          assert.equal(new URL(url).pathname, "/locations/3367/stats");
          assert.equal(new URL(url).searchParams.get("start"), range.start);
          assert.equal(options.signal, signal);
          return { ok: true, json: async () => response };
        };
        assert.deepEqual(
          await getLocationStatistics("3367", range, signal),
          response,
        );
        globalThis.fetch = async () => ({ ok: false, status: 404 });
        assert.equal(await getLocationStatistics("3367", range, signal), null);
        await assert.rejects(
          getLocationHistory("3367", range, signal),
          (e) => e.status === 404,
        );
      },
    );
    await t.test(
      "statistics rejects wrong identities, ranges, and malformed values",
      async () => {
        const response = {
          location_id: 3367,
          ...range,
          statistics: {
            total_readings: 5,
            average_count: 2.4,
            minimum_count: 0,
            maximum_count: 6,
          },
        };
        for (const data of [
          null,
          {},
          { ...response, location_id: 999 },
          { ...response, start: "2026-10-17T00:00:00Z" },
          {
            ...response,
            statistics: { ...response.statistics, total_readings: -1 },
          },
          {
            ...response,
            statistics: { ...response.statistics, average_count: "2.4" },
          },
        ]) {
          globalThis.fetch = async () => ({ ok: true, json: async () => data });
          await assert.rejects(
            getLocationStatistics("3367", range, signal),
            /unexpected response/,
          );
        }
      },
    );
    await t.test(
      "history and statistics preserve server errors and handle invalid JSON",
      async () => {
        for (const request of [getLocationHistory, getLocationStatistics]) {
          globalThis.fetch = async () => ({ ok: false, status: 503 });
          await assert.rejects(
            request("3367", range, signal),
            (e) => e.status === 503,
          );
          globalThis.fetch = async () => ({
            ok: true,
            json: async () => {
              throw new SyntaxError();
            },
          });
          await assert.rejects(
            request("3367", range, signal),
            /unexpected response/,
          );
        }
      },
    );
    await t.test(
      "single latest reading rejects another location's response",
      async () => {
        globalThis.fetch = async () => ({
          ok: true,
          json: async () => ({ ...reading, LocationId: 999 }),
        });
        await assert.rejects(
          getLocations("3367", signal),
          /unexpected response/,
        );
      },
    );
    await t.test("staleness takes precedence over open status", () => {
      assert.match(readingStatus({ ...reading, is_stale: true }), /Outdated/);
      assert.match(
        readingStatus({ ...reading, collection_is_stale: true }),
        /Outdated/,
      );
      assert.equal(readingStatus(reading), "Reported open");
      assert.equal(
        readingStatus({ ...reading, IsClosed: true }),
        "Reported closed",
      );
      assert.equal(
        readingStatus({ ...reading, IsClosed: null }),
        "Opening status unknown",
      );
      assert.equal(formatReadingTime(null), "Not provided");
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
  }
});

test("request timeout configuration", () => {
  for (const value of ["90000", " 90000 ", "1000", "300000"]) {
    assert.equal(getRequestTimeoutMs(value), Number(value));
  }
  for (const value of [
    "",
    "abc",
    "0",
    "-1",
    "999",
    "300001",
    "1.5",
    "Infinity",
  ]) {
    assert.equal(getRequestTimeoutMs(value), 15000);
  }
  const original = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
  try {
    delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
    assert.equal(getRequestTimeoutMs(), 15000);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = "90000";
    assert.equal(getRequestTimeoutMs(), 90000);
  } finally {
    if (original === undefined) delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
    else process.env.EXPO_PUBLIC_API_TIMEOUT_MS = original;
  }
});
