import { useCallback, useMemo, useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { EmptyState } from "@/components/ui/empty-state";
import { areaForLocation, toAreaStatistics } from "@/data/adapters/locations";
import { useLocations } from "@/data/api/use-locations";
import { getLocationStatistics } from "@/data/api/locations";
import { useApiResource } from "@/data/api/use-api-resource";
import { recentRange } from "@/data/api/recent-range";
import {
  facilityFilterId,
  facilityFilterOptions,
  matchesFacilityFilter,
} from "@/data/reference/source-facilities";
import { RequestState } from "@/features/areas/request-state";
import { useLocationForecasts } from "@/data/api/use-location-forecasts";
import { ForecastCard } from "./forecast-card";
import { StatisticsCard } from "@/features/areas/statistics-card";

const rangeOptions = [
  { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past 7 days" },
  { value: "30", label: "Past 30 days" },
] as const;

export function TrendsScreen() {
  const locations = useLocations();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>();
  const [days, setDays] = useState("7");
  const locationIds = useMemo(
    () => locations.rows.map((row) => String(row.LocationId)),
    [locations.rows],
  );
  const loadStatistics = useCallback(
    (signal: AbortSignal) => {
      const range = recentRange(Number(days));
      return Promise.all(
        locationIds.map((id) => getLocationStatistics(id, range, signal)),
      );
    },
    [locationIds, days],
  );
  const statistics = useApiResource(
    locationIds.length > 0 ? loadStatistics : null,
    `trends:${locationIds.join(",")}:days:${days}`,
  );
  const allSummaries = (statistics.data ?? []).flatMap((response) => {
    if (!response || response.statistics.total_readings === 0) return [];
    const location = locations.rows.find(
      (row) => row.LocationId === response.location_id,
    );
    if (!location) return [];
    const area = areaForLocation(response.location_id);
    const summary = toAreaStatistics(area, response);
    return summary
      ? [{ area, summary, facilityId: facilityFilterId(location.FacilityId) }]
      : [];
  });
  const facilityOptions = facilityFilterOptions(
    allSummaries.map((entry) => entry.facilityId),
  );
  const facilityId = facilityOptions.some(
    (option) => option.value === selectedFacilityId,
  )
    ? selectedFacilityId
    : facilityOptions[0]?.value;
  const summaries = allSummaries.filter((entry) =>
    matchesFacilityFilter(entry.facilityId, facilityId),
  );

  const forecasts = useLocationForecasts(locationIds);

  return (
    <Screen
      refreshing={locations.loading || statistics.loading || forecasts.loading}
      onRefresh={() => {
        locations.refresh();
        statistics.refresh();
        forecasts.refresh();
      }}
    >
      <ScreenHeading
        title="Historical readings"
        subtitle="Compare last reported counts over a date range."
      />
      <RequestState
        loading={locations.loading}
        error={locations.error}
        refresh={locations.refresh}
        showRefresh={false}
        variant="inline"
      />
      <Section title="Choose a source location">
        {(statistics.loading || statistics.error) && (
          <RequestState
            loading={statistics.loading}
            error={statistics.error}
            refresh={statistics.refresh}
            showRefresh={false}
            variant="inline"
          />
        )}
        {facilityOptions.length > 0 && (
          <ChoiceGroup
            label="Source facility"
            options={facilityOptions}
            value={facilityId!}
            onChange={setSelectedFacilityId}
          />
        )}
        {!locations.loading &&
          !locations.error &&
          !statistics.loading &&
          !statistics.error &&
          facilityOptions.length === 0 && (
            <EmptyState
              title="No summary entries available"
              description="No source facilities have valid summary readings in this date range."
            />
          )}
      </Section>
      <Section title="Date range">
        <ChoiceGroup
          label="Statistics date range"
          options={rangeOptions}
          value={days}
          onChange={setDays}
        />
      </Section>
      {facilityId && (
        <Section title="Snapshot summary">
          {summaries.map(({ area, summary }) => (
            <StatisticsCard
              key={area.id}
              title={area.name}
              statistics={summary}
              compactCounts
            />
          ))}
        </Section>
      )}
      <Section
        title="Insights"
        description="Hourly predictions for all locations over the next 24 hours."
      >
        {(forecasts.loading || forecasts.error) && (
          <RequestState
            loading={forecasts.loading}
            error={forecasts.error}
            refresh={forecasts.refresh}
          />
        )}
        {forecasts.data?.forecasts.map((forecast) => (
          <ForecastCard
            key={forecast.location_id}
            forecast={forecast}
            title={`${areaForLocation(forecast.location_id).name} · Next 24 hours`}
          />
        ))}
        {forecasts.data?.unavailableLocationIds.map((id) => (
          <RequestState
            key={id}
            loading={forecasts.loading}
            error={`Predictions are temporarily unavailable for ${areaForLocation(Number(id)).name}.`}
            refresh={forecasts.refresh}
          />
        ))}
        {!locations.loading && !locations.error && locationIds.length === 0 && (
          <EmptyState
            icon="bulb-outline"
            title="No prediction locations available"
            description="Load source locations to view occupancy predictions."
          />
        )}
      </Section>
    </Screen>
  );
}
