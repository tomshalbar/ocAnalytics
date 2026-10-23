import { useCallback } from "react";
import { getLocations } from "./locations";
import { useApiResource } from "./use-api-resource";

export function useLocations(locationId?: string) {
  const load = useCallback(
    (signal: AbortSignal) => getLocations(locationId, signal),
    [locationId],
  );
  const resource = useApiResource(load);
  return { ...resource, rows: resource.data ?? [] };
}
