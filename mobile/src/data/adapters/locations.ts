import type {
  LocationReading,
  LocationStatisticsResponse,
} from "../api/location-contracts";
import type { Area, AreaObservation, AreaStatistics } from "../../domain/area";

// Pure adapters only: no requests, inferred metadata, or count conversions.
export function toAreaObservation(
  area: Area,
  reading: LocationReading,
): AreaObservation | undefined {
  if (area.sourceLocationId !== reading.LocationId) return undefined;
  return {
    areaId: area.id,
    readingId: reading.id,
    sourceLocationId: reading.LocationId,
    sourceFacilityId: reading.FacilityId,
    participantCount: reading.CountOfParticipants,
    reportedCapacityPercentage: reading.PercetageCapacity,
    lastReportedCount: reading.LastCount,
    isClosed: reading.IsClosed,
    sourceUpdatedAt: reading.LastUpdatedDateAndTime,
    collectedAt: reading.runDatetime,
    sourceIsStale: reading.is_stale,
    collectionIsStale: reading.collection_is_stale,
  };
}

export function toAreaStatistics(
  area: Area,
  response: LocationStatisticsResponse,
): AreaStatistics | undefined {
  if (area.sourceLocationId !== response.location_id) return undefined;
  return {
    areaId: area.id,
    sourceLocationId: response.location_id,
    start: response.start,
    end: response.end,
    totalReadings: response.statistics.total_readings,
    averageLastCount: response.statistics.average_count,
    minimumLastCount: response.statistics.minimum_count,
    maximumLastCount: response.statistics.maximum_count,
  };
}
