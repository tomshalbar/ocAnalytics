import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  toAreaObservation,
  toAreaStatistics,
  areaForLocation,
} from "../src/data/adapters/locations.ts";
import {
  availabilityLabel,
  observationStatus,
} from "../src/features/areas/availability-label.ts";

const area = {
  id: "verified-area",
  gymId: "gym",
  name: "Example area",
  kind: "court",
  activity: "tennis",
  sourceLocationId: 123,
};
const reading = {
  id: 7,
  LocationId: 123,
  FacilityId: null,
  CountOfParticipants: 0,
  PercetageCapacity: 0,
  LastCount: 12,
  IsClosed: false,
  LastUpdatedDateAndTime: "2026-10-18T12:00:00Z",
  runDatetime: "2026-10-18T12:01:00Z",
  is_stale: false,
  collection_is_stale: false,
};

test("location display names match every CSV entry and preserve backend identities", () => {
  execFileSync(process.execPath, [
    fileURLToPath(
      new URL("../scripts/generate-location-names.mjs", import.meta.url),
    ),
    "--check",
  ]);
  const [ids, names] = readFileSync(
    new URL("../src/data/reference/id_to_name.csv", import.meta.url),
    "utf8",
  )
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(",").map((value) => value.trim()));
  ids.forEach((id, index) => {
    const source = areaForLocation(Number(id));
    assert.equal(source.name, names[index]);
    assert.equal(source.id, id);
    assert.equal(source.sourceLocationId, Number(id));
    assert.equal(source.gymId, null);
    assert.equal(source.activity, null);
    assert.equal(source.kind, "location");
  });
});

test("unmapped locations retain fallback names without inferred activities", () => {
  const source = areaForLocation(123);
  assert.equal(source.id, "123");
  assert.equal(source.name, "Location 123");
  assert.equal(source.gymId, null);
  assert.equal(source.activity, null);
  assert.equal(source.kind, "location");
  assert.equal(toAreaObservation(source, reading).sourceLocationId, 123);
});

test("only an explicit matching location mapping can populate an area", () => {
  assert.equal(
    toAreaObservation({ ...area, sourceLocationId: null }, reading),
    undefined,
  );
  assert.equal(
    toAreaObservation(area, { ...reading, LocationId: 456 }),
    undefined,
  );
  assert.equal(toAreaObservation(area, reading).areaId, area.id);
});

test("distinct counts, zero, null, and timestamps retain their meanings", () => {
  const observation = toAreaObservation(area, reading);
  assert.equal(observation.participantCount, 0);
  assert.equal(observation.lastReportedCount, 12);
  assert.equal(observation.reportedCapacityPercentage, 0);
  assert.equal(observation.sourceFacilityId, null);
  assert.equal(observation.sourceUpdatedAt, reading.LastUpdatedDateAndTime);
  assert.equal(observation.collectedAt, reading.runDatetime);
  assert.equal(availabilityLabel(observation), "Last reported count: 12");
  const missing = toAreaObservation(area, {
    ...reading,
    CountOfParticipants: null,
    LastCount: null,
    PercetageCapacity: null,
    LastUpdatedDateAndTime: null,
  });
  assert.equal(missing.participantCount, null);
  assert.equal(missing.sourceUpdatedAt, null);
  assert.equal(availabilityLabel(missing), "Last reported count: Not provided");
  assert.equal(
    availabilityLabel(toAreaObservation(area, { ...reading, LastCount: 0 })),
    "Last reported count: 0",
  );
  assert.equal(availabilityLabel(), "No reading available");
});

test("outdated source or collection cannot imply current opening status", () => {
  for (const status of [true, false, null]) {
    for (const freshness of [
      { is_stale: true },
      { collection_is_stale: true },
    ]) {
      assert.match(
        observationStatus(
          toAreaObservation(area, {
            ...reading,
            IsClosed: status,
            ...freshness,
          }),
        ),
        /current status unconfirmed/,
      );
    }
  }
  assert.equal(
    observationStatus(toAreaObservation(area, reading)),
    "Reported open",
  );
  assert.equal(
    observationStatus(toAreaObservation(area, { ...reading, IsClosed: true })),
    "Reported closed",
  );
  assert.equal(
    observationStatus(toAreaObservation(area, { ...reading, IsClosed: null })),
    "Opening status unknown",
  );
});

test("statistics bind to a verified location and preserve LastCount summary semantics", () => {
  const response = {
    location_id: 123,
    start: "2026-10-18T00:00:00Z",
    end: "2026-10-19T00:00:00Z",
    statistics: {
      total_readings: 4,
      average_count: 2.5,
      minimum_count: 0,
      maximum_count: null,
    },
  };
  assert.equal(
    toAreaStatistics({ ...area, sourceLocationId: null }, response),
    undefined,
  );
  assert.equal(
    toAreaStatistics(area, { ...response, location_id: 456 }),
    undefined,
  );
  const summary = toAreaStatistics(area, response);
  assert.equal(summary.averageLastCount, 2.5);
  assert.equal(summary.minimumLastCount, 0);
  assert.equal(summary.maximumLastCount, null);
  assert.equal(summary.totalReadings, 4);
  assert.equal(summary.start, response.start);
  assert.equal(summary.end, response.end);
});
