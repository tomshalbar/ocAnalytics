import assert from "node:assert/strict";
import { test } from "node:test";
import { getLocationForecast } from "../src/data/api/forecasts.ts";

const payload = () => ({
  location_id: 3367,
  model: "timesfm",
  used_fallback: false,
  generated_at: "2026-11-18T21:18:11Z",
  data_through: "2026-11-18T20:00:00Z",
  forecast: [
    {
      timestamp: "2026-11-18T22:00:00Z",
      median: 126.66,
      lower: 99.05,
      upper: 154.37,
    },
    {
      timestamp: "2026-11-18T23:00:00Z",
      median: 130.86,
      lower: 101.15,
      upper: 159.88,
    },
  ],
});

test("forecast client contract and failures", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  const signal = new AbortController().signal;
  const respond = (data) => {
    globalThis.fetch = async () => ({ ok: true, json: async () => data });
  };
  process.env.EXPO_PUBLIC_API_URL = "https://example.test/";
  try {
    await t.test("backend URL and cancellation signal", async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(
          url,
          "https://example.test/locations/3367/forecast?hours=2",
        );
        assert.equal(options.signal, signal);
        return { ok: true, json: async () => payload() };
      };
      assert.deepEqual(await getLocationForecast("3367", 2, signal), payload());
    });
    await t.test("missing predictions remain errors, not zero", async () => {
      for (const status of [404, 503]) {
        globalThis.fetch = async () => ({ ok: false, status });
        await assert.rejects(
          getLocationForecast("3367", 2, signal),
          (e) =>
            e.status === status && /Predictions.*unavailable/.test(e.message),
        );
      }
    });
    await t.test("invalid requests fail before fetching", async () => {
      globalThis.fetch = async () => {
        assert.fail("Should not request");
      };
      for (const hours of [0, 169, 1.5, NaN])
        await assert.rejects(
          getLocationForecast("3367", hours, signal),
          /1 to 168/,
        );
      await assert.rejects(
        getLocationForecast("../3367", 2, signal),
        /unavailable/,
      );
    });
    await t.test(
      "rejects mismatched, incomplete and malformed predictions",
      async () => {
        const invalid = [
          null,
          {},
          { ...payload(), location_id: 3368 },
          { ...payload(), forecast: [] },
        ];
        for (const mutate of [
          (p) => {
            p.forecast[0].median = NaN;
          },
          (p) => {
            p.forecast[0].lower = -1;
          },
          (p) => {
            p.forecast[0].upper = 1;
          },
          (p) => {
            p.forecast.reverse();
          },
          (p) => {
            p.forecast[1].timestamp = p.forecast[0].timestamp;
          },
          (p) => {
            p.forecast[0].timestamp = "2026-11-18T22:00:00";
          },
          (p) => {
            p.generated_at = "bad";
          },
        ]) {
          const p = payload();
          mutate(p);
          invalid.push(p);
        }
        for (const p of invalid) {
          respond(p);
          await assert.rejects(
            getLocationForecast("3367", 2, signal),
            /unexpected forecast/,
          );
        }
      },
    );
    await t.test(
      "preserves fallback labels and genuine zero counts",
      async () => {
        const p = payload();
        p.model = "naive";
        p.used_fallback = true;
        p.forecast[0].median = p.forecast[0].lower = p.forecast[0].upper = 0;
        respond(p);
        assert.deepEqual(await getLocationForecast("3367", 2, signal), p);
      },
    );
    await t.test("handles network, JSON and configuration errors", async () => {
      globalThis.fetch = async () => {
        throw new TypeError("offline");
      };
      await assert.rejects(
        getLocationForecast("3367", 2, signal),
        /Cannot reach/,
      );
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => {
          throw new Error("invalid json");
        },
      });
      await assert.rejects(
        getLocationForecast("3367", 2, signal),
        /unexpected response/,
      );
      delete process.env.EXPO_PUBLIC_API_URL;
      await assert.rejects(
        getLocationForecast("3367", 2, signal),
        /EXPO_PUBLIC_API_URL/,
      );
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
  }
});
