import { useCallback, useMemo } from "react";

import { getLocationForecast } from "./forecasts";
import { useApiResource } from "./use-api-resource";

export function useLocationForecasts(
  locationIds: readonly string[],
  hours = 24,
) {
  const idsKey = [...new Set(locationIds)].sort().join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return {
              id,
              forecast: await getLocationForecast(id, hours, signal),
            };
          } catch (error) {
            if (signal.aborted) throw error;
            return { id, forecast: null };
          }
        }),
      );
      return {
        forecasts: results.flatMap(({ forecast }) =>
          forecast ? [forecast] : [],
        ),
        unavailableLocationIds: results
          .filter(({ forecast }) => !forecast)
          .map(({ id }) => id),
      };
    },
    [ids, hours],
  );
  return useApiResource(
    ids.length ? load : null,
    `forecasts:${idsKey}:hours:${hours}`,
  );
}
