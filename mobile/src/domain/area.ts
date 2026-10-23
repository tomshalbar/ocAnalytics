export type Activity = "pickleball" | "tennis" | "weight-training";
export type CrowdLevel = "quiet" | "moderate" | "busy" | "unknown";

export type Area = {
  id: string;
  gymId: string;
  name: string;
  kind: "court" | "room" | "zone";
  activity: Activity;
  // Only populate after verifying the RecSports location-to-area mapping.
  sourceLocationId: number | null;
};

// An observation is separate from an area and from any future prediction.
export type AreaObservation = {
  areaId: string;
  readingId: number;
  sourceLocationId: number;
  sourceFacilityId: number | null;
  participantCount: number | null;
  reportedCapacityPercentage: number | null;
  lastReportedCount: number | null;
  isClosed: boolean | null;
  sourceUpdatedAt: string | null;
  collectedAt: string;
  sourceIsStale: boolean;
  collectionIsStale: boolean;
};

export type AreaStatistics = {
  areaId: string;
  sourceLocationId: number;
  start: string;
  end: string;
  totalReadings: number;
  averageLastCount: number | null;
  minimumLastCount: number | null;
  maximumLastCount: number | null;
};
