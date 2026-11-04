import { useCallback, useMemo } from "react";
import { getLocations } from "./locations";
import { useApiResource } from "./use-api-resource";

export function useLocations(locationId?: string) {
  const load = useCallback(
    (signal: AbortSignal) => getLocations(undefined, signal),
    [],
  );
  const resource = useApiResource(load, "locations:latest");
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (row) =>
          locationId === undefined || row.LocationId === Number(locationId),
      ),
    [resource.data, locationId],
  );
  return {
    ...resource,
    rows,
    notFound:
      resource.notFound ||
      (locationId !== undefined &&
        resource.data !== undefined &&
        rows.length === 0),
  };
}
