import { useCallback } from "react";
import type { LocationTimeRange } from "./location-contracts";
import { getLocationStatistics } from "./locations";
import { useApiResource } from "./use-api-resource";

export function useLocationStatistics(
  locationId: string | undefined,
  range: LocationTimeRange,
) {
  const load = useCallback(
    (signal: AbortSignal) => getLocationStatistics(locationId!, range, signal),
    [locationId, range],
  );
  return useApiResource(locationId === undefined ? null : load);
}
