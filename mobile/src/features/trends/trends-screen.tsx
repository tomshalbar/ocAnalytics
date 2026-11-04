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
import { RequestState } from "@/features/areas/request-state";
import { StatisticsCard } from "@/features/areas/statistics-card";

const rangeOptions = [
  { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past 7 days" },
  { value: "30", label: "Past 30 days" },
] as const;

function facilityFilterId(facilityId: number | null): string {
  if (facilityId === 596) return "Southwest Rec";
  return facilityId === 597 || facilityId === 725
    ? "Student Rec"
    : String(facilityId ?? "unknown");
}

export function TrendsScreen() {
  const locations = useLocations();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>();
  const [days, setDays] = useState("7");
  const [rangeRevision, setRangeRevision] = useState(0);
  const locationIds = useMemo(
    () => locations.rows.map((row) => String(row.LocationId)),
    [locations.rows],
  );
  const range = useMemo(() => {
    void rangeRevision;
    const end = new Date();
    return {
      start: new Date(end.getTime() - Number(days) * 86400000).toISOString(),
      end: end.toISOString(),
    };
  }, [days, rangeRevision]);
  const loadStatistics = useCallback(
    (signal: AbortSignal) =>
      Promise.all(
        locationIds.map((id) => getLocationStatistics(id, range, signal)),
      ),
    [locationIds, range],
  );
  const statistics = useApiResource(
    locationIds.length > 0 ? loadStatistics : null,
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
  const facilityOptions = Array.from(
    new Set(allSummaries.map((entry) => entry.facilityId)),
    (id) => ({ value: id, label: id === "unknown" ? "Not provided" : id }),
  );
  const facilityId = facilityOptions.some(
    (option) => option.value === selectedFacilityId,
  )
    ? selectedFacilityId
    : facilityOptions[0]?.value;
  const summaries = allSummaries.filter(
    (entry) => entry.facilityId === facilityId,
  );

  return (
    <Screen
      refreshing={locations.loading || statistics.loading}
      onRefresh={() => {
        locations.refresh();
        setRangeRevision((value) => value + 1);
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
            />
          ))}
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
