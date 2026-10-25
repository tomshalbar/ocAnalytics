import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRequestTimeoutMs,
  ApiError,
  getLocations,
  readingStatus,
  formatReadingTime,
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
