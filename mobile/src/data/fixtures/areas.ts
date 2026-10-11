import type { Area, AreaObservation } from "@/domain/area";

export const demoAreas: readonly Area[] = [
  {
    id: "southwest-pickleball",
    gymId: "southwest",
    name: "Pickleball",
    kind: "court",
    activity: "pickleball",
  },
  {
    id: "southwest-tennis",
    gymId: "southwest",
    name: "Tennis",
    kind: "court",
    activity: "tennis",
  },
  {
    id: "southwest-weights",
    gymId: "southwest",
    name: "Weight room",
    kind: "room",
    activity: "weight-training",
  },
];

// Fixed observations for layout previews; never presented as live readings.
export const demoObservations: readonly AreaObservation[] = [
  {
    areaId: "southwest-pickleball",
    crowdLevel: "quiet",
    availableUnits: 6,
    totalUnits: 8,
    unitLabel: "courts",
    observedAt: "2026-10-06T14:00:00Z",
  },
  {
    areaId: "southwest-tennis",
    crowdLevel: "moderate",
    availableUnits: 2,
    totalUnits: 6,
    unitLabel: "courts",
    observedAt: "2026-10-06T14:00:00Z",
  },
  {
    areaId: "southwest-weights",
    crowdLevel: "busy",
    availableUnits: null,
    totalUnits: 1,
    unitLabel: "rooms",
    observedAt: "2026-10-06T14:00:00Z",
  },
];
