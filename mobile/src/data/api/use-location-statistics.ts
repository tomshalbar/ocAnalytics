import { useCallback } from "react";
import { getLocationStatistics } from "./locations";
import { recentRange } from "./recent-range";
import { useApiResource } from "./use-api-resource";

export function useLocationStatistics(
  locationId: string | undefined,
  days: number,
) {
  const load = useCallback(
    (signal: AbortSignal) =>
      getLocationStatistics(locationId!, recentRange(days), signal),
    [locationId, days],
  );
  return useApiResource(
    locationId === undefined ? null : load,
    `statistics:${locationId}:days:${days}`,
  );
}
