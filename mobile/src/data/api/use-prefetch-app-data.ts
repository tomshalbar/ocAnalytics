import { useEffect } from "react";

import {
  getLocationHistory,
  getLocationStatistics,
  getRequestTimeoutMs,
} from "./locations";
import { recentRange } from "./recent-range";
import { getCachedResource } from "./resource-cache";
import { useLocations } from "./use-locations";

// Load the screens' datasets at launch so opening a screen needs no new request.
export function usePrefetchAppData() {
  const { rows } = useLocations();
  useEffect(() => {
    if (rows.length === 0) return;
    const timeout = getRequestTimeoutMs();
    const ids = rows.map((row) => String(row.LocationId));
    const dailyStatistics = ids.map((id) =>
      getCachedResource(
        `statistics:${id}:days:1`,
        (signal) => getLocationStatistics(id, recentRange(1), signal),
        timeout,
      ),
    );
    dailyStatistics.forEach((resource) => void resource.ensureLoaded());
    ids.forEach((id) => {
      void getCachedResource(
        `history:${id}:days:1`,
        (signal) =>
          getLocationHistory(
            id,
            { ...recentRange(1), limit: 50, offset: 0 },
            signal,
          ),
        timeout,
      ).ensureLoaded();
    });
    for (const days of [1, 7, 30]) {
      void getCachedResource(
        `trends:${ids.join(",")}:days:${days}`,
        async (signal) => {
          if (days === 1) {
            return Promise.all(
              dailyStatistics.map(async (resource) => {
                await resource.ensureLoaded();
                const state = resource.getSnapshot();
                if (state.error) throw new Error(state.error);
                return state.data ?? null;
              }),
            );
          }
          const range = recentRange(days);
          return Promise.all(
            ids.map((id) => getLocationStatistics(id, range, signal)),
          );
        },
        timeout,
      ).ensureLoaded();
    }
  }, [rows]);
}
