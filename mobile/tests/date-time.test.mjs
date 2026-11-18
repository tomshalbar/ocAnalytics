import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDateTimeFormatter,
  parseTimestamp,
} from "../src/time/date-time.ts";
import { lastUpdatedLabel } from "../src/domain/readings/last-updated-label.ts";

const formatter = (timeZone, locale = "en-US") =>
  createDateTimeFormatter({ locale, timeZone });

test("one instant displays the user's date and time across midnight and year boundaries", () => {
  const instant = "2026-01-01T00:30:00Z";
  const losAngeles = formatter("America/Los_Angeles");
  const tokyo = formatter("Asia/Tokyo");
  assert.equal(losAngeles.formatDate(instant), "12/31/2025");
  assert.equal(tokyo.formatDate(instant), "1/1/2026");
  assert.match(losAngeles.formatDateTime(instant), /4:30:00 PM/);
  assert.match(tokyo.formatDateTime(instant), /9:30:00 AM/);
  assert.equal(losAngeles.calendarKeys(instant).monthKey, "2025-12");
  assert.equal(tokyo.calendarKeys(instant).monthKey, "2026-01");
});

test("equivalent offset-aware timestamps format identically and have the same elapsed age", () => {
  const utc = "2026-11-18T15:00:00Z";
  const offset = "2026-11-18T10:00:00-05:00";
  const local = formatter("Asia/Kolkata");
  assert.equal(local.formatDateTime(utc), local.formatDateTime(offset));
  assert.match(local.formatDateTime(utc), /8:30:00 PM/);
  const now = Date.parse("2026-11-18T16:00:00Z");
  assert.equal(lastUpdatedLabel(utc, now), "Last updated 1 hour ago");
  assert.equal(lastUpdatedLabel(offset, now), lastUpdatedLabel(utc, now));
});

test("display follows the user's locale", () => {
  const local = formatter("Europe/Berlin", "de-DE");
  assert.equal(local.formatDate("2026-11-18T15:00:00Z"), "18.11.2026");
  assert.match(local.formatDateTime("2026-11-18T15:00:00Z"), /16:00:00/);
});

test("missing, invalid and offset-free timestamps never become misleading local times", () => {
  const local = formatter("America/New_York");
  for (const value of [
    null,
    "",
    "invalid",
    "2026-11-18T15:00:00",
    "2026-11-18",
  ]) {
    assert.ok(Number.isNaN(parseTimestamp(value)));
    assert.equal(local.formatDate(value), "Not provided");
    assert.equal(local.formatDateTime(value), "Not provided");
  }
});
