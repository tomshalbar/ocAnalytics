import { useCallback } from "react";
import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { areaForLocation, toAreaObservation } from "@/data/adapters/locations";
import { getLocationHistory, isVisibleLocation } from "@/data/api/locations";
import { useApiResource } from "@/data/api/use-api-resource";
import { useLocations } from "@/data/api/use-locations";
import { useLocationStatistics } from "@/data/api/use-location-statistics";
import { recentRange } from "@/data/api/recent-range";
import { ObservationDetails } from "@/features/areas/observation-details";
import { RequestState } from "@/features/areas/request-state";
import { ReadingHistoryChart } from "./reading-history/reading-history-chart";

const PAGE_SIZE = 50;

export function AreaDetailsScreen({ areaId }: { areaId: string }) {
  const latest = useLocations(areaId);
  const statistics = useLocationStatistics(areaId, 1);
  const loadHistory = useCallback(
    (signal: AbortSignal) =>
      getLocationHistory(
        areaId,
        { ...recentRange(1), limit: PAGE_SIZE, offset: 0 },
        signal,
      ),
    [areaId],
  );
  const history = useApiResource(loadHistory, `history:${areaId}:days:1`);
  const area = areaForLocation(Number(areaId));
  const observation = latest.rows[0] && toAreaObservation(area, latest.rows[0]);
  const refreshing = latest.loading || statistics.loading || history.loading;
  const refresh = () => {
    latest.refresh();
    statistics.refresh();
    history.refresh();
  };

  if (
    latest.notFound ||
    !/^\d+$/.test(areaId) ||
    !isVisibleLocation(Number(areaId))
  )
    return (
      <Screen headerShown refreshing={refreshing} onRefresh={refresh}>
        <EmptyState
          title="Location not found"
          description="No latest reading exists for this source location."
        />
        <Link href="/" replace>
          <AppText tone="accent">Return to Home</AppText>
        </Link>
      </Screen>
    );

  return (
    <Screen headerShown refreshing={refreshing} onRefresh={refresh}>
      <ScreenHeading
        title={area.name}
        subtitle="Latest source reading and the past 24 hours of collected snapshots."
      />
      <Section title="Latest reading">
        <RequestState
          loading={latest.loading}
          error={latest.error}
          refresh={latest.refresh}
          showRefresh={false}
          variant="inline"
        />
        {observation && (
          <Card>
            <AppText variant="caption" tone="muted">
              Source facility: {observation.sourceFacilityId ?? "Not provided"}
            </AppText>
            <ObservationDetails observation={observation} />
          </Card>
        )}
      </Section>
      <Section
        title="Reading history"
        description="Latest valid last reported count per hour in the past 24 hours."
      >
        {!!history.data?.length && (
          <ReadingHistoryChart readings={history.data} />
        )}
        {!history.loading && !history.error && history.data?.length === 0 && (
          <EmptyState
            title="No readings in this page"
            description="An empty page does not establish that this location was closed."
          />
        )}
      </Section>
    </Screen>
  );
}
