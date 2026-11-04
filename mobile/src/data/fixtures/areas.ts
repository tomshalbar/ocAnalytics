import type { Area, AreaObservation } from "@/domain/area";
import type { LocationReading } from "../api/location-contracts";
import { toAreaObservation } from "../adapters/locations";

export const demoAreas: readonly Area[] = [
  {
    id: "southwest-pickleball",
    gymId: "southwest",
    name: "Pickleball",
    kind: "court",
    activity: "pickleball",
    sourceLocationId: null,
  },
  {
    id: "southwest-tennis",
    gymId: "southwest",
    name: "Tennis",
    kind: "court",
    activity: "tennis",
    sourceLocationId: null,
  },
  {
    id: "southwest-weights",
    gymId: "southwest",
    name: "Weight room",
    kind: "room",
    activity: "weight-training",
    sourceLocationId: null,
  },
];

// Synthetic IDs and readings for layout previews, NOT verified source mappings.
// The real area catalog above intentionally keeps sourceLocationId null.
export const demoReadings: readonly LocationReading[] = [
  {
    id: 1,
    LocationId: 1001,
    FacilityId: null,
    CountOfParticipants: 8,
    PercetageCapacity: null,
    LastCount: 6,
    IsClosed: false,
    LastUpdatedDateAndTime: "2026-10-06T14:00:00Z",
    runDatetime: "2026-10-06T14:01:00Z",
    is_stale: false,
    collection_is_stale: false,
  },
  {
    id: 2,
    LocationId: 1002,
    FacilityId: null,
    CountOfParticipants: 0,
    PercetageCapacity: null,
    LastCount: 0,
    IsClosed: true,
    LastUpdatedDateAndTime: "2026-10-06T14:00:00Z",
    runDatetime: "2026-10-06T14:01:00Z",
    is_stale: false,
    collection_is_stale: false,
  },
  {
    id: 3,
    LocationId: 1003,
    FacilityId: null,
    CountOfParticipants: null,
    PercetageCapacity: null,
    LastCount: 42,
    IsClosed: null,
    LastUpdatedDateAndTime: null,
    runDatetime: "2026-10-06T14:01:00Z",
    is_stale: true,
    collection_is_stale: false,
  },
];

export const demoObservations: readonly AreaObservation[] =
  demoReadings.flatMap((reading, index) => {
    const observation = toAreaObservation(
      { ...demoAreas[index], sourceLocationId: reading.LocationId },
      reading,
    );
    return observation ? [observation] : [];
  });
