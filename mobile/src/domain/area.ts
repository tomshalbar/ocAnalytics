export type Activity = "pickleball" | "tennis" | "weight-training";
export type CrowdLevel = "quiet" | "moderate" | "busy" | "unknown";

export type Area = {
  id: string;
  gymId: string;
  name: string;
  kind: "court" | "room" | "zone";
  activity: Activity;
};

// An observation is separate from an area and from any future prediction.
export type AreaObservation = {
  areaId: string;
  crowdLevel: CrowdLevel;
  availableUnits: number | null;
  totalUnits: number;
  unitLabel: string;
  observedAt: string;
};
