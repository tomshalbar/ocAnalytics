import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocations } from "@/data/api/use-locations";
import { areaForLocation, toAreaObservation } from "@/data/adapters/locations";
import { RequestState } from "@/features/areas/request-state";
import { AreaCard } from "./components/area-card";

export function HomeScreen() {
  const { rows, loading, error, refresh } = useLocations();
  return (
    <Screen>
      <ScreenHeading
        eyebrow="OPEN COURT ANALYTICS"
        title="Latest activity"
        subtitle="Reported readings from RecSports. Locations are labeled by source ID until names are verified."
      />
      <RequestState loading={loading} error={error} refresh={refresh} />
      <Section
        title="Latest readings"
        description="Latest collected snapshot per source location; check each reading’s freshness."
      >
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="No readings available"
            description="The backend has not collected any location readings yet."
          />
        )}
        {rows.map((reading) => {
          const area = areaForLocation(reading.LocationId);
          return (
            <AreaCard
              key={area.id}
              area={area}
              observation={toAreaObservation(area, reading)}
            />
          );
        })}
      </Section>
    </Screen>
  );
}
