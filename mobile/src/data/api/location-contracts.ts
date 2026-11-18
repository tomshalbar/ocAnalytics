// Wire contracts from backend/api/schemas.py. Preserve the upstream spelling.
export type LocationReading = {
  id: number;
  LocationId: number;
  FacilityId: number | null;
  CountOfParticipants: number | null;
  PercetageCapacity: number | null;
  LastCount: number | null;
  IsClosed: boolean | null;
  LastUpdatedDateAndTime: string | null;
  runDatetime: string;
  is_stale: boolean;
  collection_is_stale: boolean;
};

export type LocationStatisticsResponse = {
  location_id: number;
  start: string;
  end: string;
  statistics: {
    total_readings: number;
    average_count: number | null;
    minimum_count: number | null;
    maximum_count: number | null;
  };
};

// Offset-aware ISO timestamps; [start, end), at most 31 days.
export type LocationTimeRange = { start: string; end: string };
export type LocationHistoryQuery = LocationTimeRange & {
  limit?: number; // Default 100, range 1–1000.
  offset?: number; // Default 0, range 0–100000.
};

export type LocationHistoryResponse = LocationReading[];
