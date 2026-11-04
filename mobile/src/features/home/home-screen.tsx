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
    <Screen refreshing={loading} onRefresh={refresh}>
      <ScreenHeading
        eyebrow="OPEN COURT ANALYTICS"
        title="Find your open court."
        subtitle="A little insight. A better time at the gym."
      />
      <RequestState
        loading={loading}
        error={error}
        refresh={refresh}
        showRefresh={false}
        variant="inline"
      />
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
