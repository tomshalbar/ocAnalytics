import { useMemo, useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { EmptyState } from "@/components/ui/empty-state";
import { areaForLocation, toAreaStatistics } from "@/data/adapters/locations";
import { useLocations } from "@/data/api/use-locations";
import { useLocationStatistics } from "@/data/api/use-location-statistics";
import { RequestState } from "@/features/areas/request-state";
import { StatisticsCard } from "@/features/areas/statistics-card";

const rangeOptions = [
  { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past 7 days" },
  { value: "30", label: "Past 30 days" },
] as const;

export function TrendsScreen() {
  const locations = useLocations();
  const [selectedId, setSelectedId] = useState<string>();
  const [days, setDays] = useState("7");
  const locationId = locations.rows.some(
    (row) => String(row.LocationId) === selectedId,
  )
    ? selectedId
    : locations.rows[0]
      ? String(locations.rows[0].LocationId)
      : undefined;
  const range = useMemo(() => {
    void locationId;
    const end = new Date();
    return {
      start: new Date(end.getTime() - Number(days) * 86400000).toISOString(),
      end: end.toISOString(),
    };
  }, [locationId, days]);
  const statistics = useLocationStatistics(locationId, range);
  const area = locationId ? areaForLocation(Number(locationId)) : undefined;
  const summary =
    area && statistics.data && toAreaStatistics(area, statistics.data);

  return (
    <Screen>
      <ScreenHeading
        title="Historical readings"
        subtitle="Compare last reported counts over a date range."
      />
      <RequestState
        loading={locations.loading}
        error={locations.error}
        refresh={locations.refresh}
      />
      <Section title="Choose a source location">
        {locations.rows.length > 0 && (
          <ChoiceGroup
            label="Source location"
            options={locations.rows.map((row) => ({
              value: String(row.LocationId),
              label: `Location ${row.LocationId}`,
            }))}
            value={locationId!}
            onChange={setSelectedId}
          />
        )}
        {!locations.loading &&
          !locations.error &&
          locations.rows.length === 0 && (
            <EmptyState
              title="No locations available"
              description="Source locations will appear after the backend collects readings."
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
      {locationId && (
        <Section title="Snapshot summary">
          <RequestState
            loading={statistics.loading}
            error={statistics.error}
            refresh={statistics.refresh}
          />
          {summary && (
            <StatisticsCard title={area!.name} statistics={summary} />
          )}
          {!statistics.loading && !statistics.error && !summary && (
            <EmptyState
              title="No valid summary readings"
              description="There are no reported-open snapshots with a LastCount in this date range."
            />
          )}
        </Section>
      )}
      <Section title="Insights">
        <EmptyState
          icon="bulb-outline"
          title="Predictions are not yet available"
          description="The API provides snapshot summaries, not hourly patterns or suggested visit times."
        />
      </Section>
    </Screen>
  );
}
