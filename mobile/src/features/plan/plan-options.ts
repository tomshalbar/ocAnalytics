import type { LocationForecast } from "../../data/api/forecasts";
import type { LocationReading } from "../../data/api/location-contracts";
import {
  facilityFilterId,
  matchesFacilityFilter,
} from "../../data/reference/source-facilities.ts";
import type { VisitRecommendation } from "../../domain/recommendation";

export type PlanOption = {
  recommendation: VisitRecommendation;
  locationId: string;
  dayKey: string;
  timestamp: number;
  predictedOccupancy: number;
};

// One best future hour per location and local calendar day. Keep the raw median
// for ranking; rounding is presentation-only, and genuine zeroes remain valid.
export function buildPlanOptions(
  forecasts: readonly LocationForecast[],
  now: number,
): PlanOption[] {
  const best = new Map<string, PlanOption>();
  for (const forecast of forecasts) {
    for (const point of forecast.forecast) {
      const timestamp = Date.parse(point.timestamp);
      if (timestamp <= now) continue;
      const date = new Date(timestamp);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const locationId = String(forecast.location_id);
      const key = `${locationId}:${dayKey}`;
      const existing = best.get(key);
      if (
        existing &&
        (existing.predictedOccupancy < point.median ||
          (existing.predictedOccupancy === point.median &&
            existing.timestamp <= timestamp))
      )
        continue;
      best.set(key, {
        locationId,
        dayKey,
        timestamp,
        predictedOccupancy: point.median,
        recommendation: {
          id: `${locationId}:${point.timestamp}`,
          areaId: locationId,
          dayLabel: date.toLocaleDateString("en-US", { weekday: "long" }),
          timeLabel: date
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              ...(date.getMinutes() ? { minute: "2-digit" } : {}),
              hour12: true,
            })
            .replace(/\s/g, ""),
          expectedCrowd: "unknown",
          reason: `Predicted ${Math.round(point.median)} people (range ${Math.round(point.lower)}–${Math.round(point.upper)}).${forecast.used_fallback ? " Baseline forecast (fallback)." : ""}`,
        },
      });
    }
  }
  return [...best.values()].sort(
    (a, b) =>
      a.predictedOccupancy - b.predictedOccupancy ||
      a.timestamp - b.timestamp ||
      a.locationId.localeCompare(b.locationId),
  );
}

export function filterPlanOptions(
  options: readonly PlanOption[],
  locations: readonly LocationReading[],
  facilityId: string | undefined,
  day: string,
) {
  const knownIds = new Set(
    locations
      .filter((location) =>
        matchesFacilityFilter(
          facilityFilterId(location.FacilityId),
          facilityId,
        ),
      )
      .map((location) => String(location.LocationId)),
  );
  return options.filter(
    (option) =>
      knownIds.has(option.locationId) &&
      (day === "all" || option.recommendation.dayLabel === day),
  );
}
