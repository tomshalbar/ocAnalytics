import { useCallback } from "react";
import { getLocationForecast } from "./forecasts";
import { useApiResource } from "./use-api-resource";

export function useLocationForecast(locationId?: string, hours = 24) {
  const load = useCallback(
    (signal: AbortSignal) => getLocationForecast(locationId!, hours, signal),
    [locationId, hours],
  );
  return useApiResource(
    locationId === undefined ? null : load,
    `forecast:${locationId}:hours:${hours}`,
  );
}
