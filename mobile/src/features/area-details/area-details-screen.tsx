import { useCallback, useMemo, useState } from "react";
import { Button } from "react-native";
import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  areaForLocation,
  toAreaObservation,
  toAreaStatistics,
} from "@/data/adapters/locations";
import { getLocationHistory, isVisibleLocation } from "@/data/api/locations";
import { useApiResource } from "@/data/api/use-api-resource";
import { useLocations } from "@/data/api/use-locations";
import { useLocationStatistics } from "@/data/api/use-location-statistics";
import { ObservationDetails } from "@/features/areas/observation-details";
import { StatisticsCard } from "@/features/areas/statistics-card";
import { RequestState } from "@/features/areas/request-state";
import { ReadingHistoryChart } from "./reading-history/reading-history-chart";

const PAGE_SIZE = 50;

export function AreaDetailsScreen({ areaId }: { areaId: string }) {
  const [offset, setOffset] = useState(0);
  const [rangeRevision, setRangeRevision] = useState(0);
  const range = useMemo(() => {
    void areaId;
    void rangeRevision;
    const end = new Date();
    return {
      start: new Date(end.getTime() - 86400000).toISOString(),
      end: end.toISOString(),
    };
  }, [areaId, rangeRevision]);
  const latest = useLocations(areaId);
  const statistics = useLocationStatistics(areaId, range);
  const loadHistory = useCallback(
    (signal: AbortSignal) =>
      getLocationHistory(
        areaId,
        { ...range, limit: PAGE_SIZE, offset },
        signal,
      ),
    [areaId, range, offset],
  );
  const history = useApiResource(loadHistory);
  const area = areaForLocation(Number(areaId));
  const observation = latest.rows[0] && toAreaObservation(area, latest.rows[0]);
  const summary = statistics.data && toAreaStatistics(area, statistics.data);
  const refreshing = latest.loading || statistics.loading || history.loading;
  const refresh = () => {
    latest.refresh();
    setOffset(0);
    setRangeRevision((value) => value + 1);
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
        title="Past 24 hours"
        description="Refresh the range to move the window up to the present."
      >
        <Button
          title="Refresh date range"
          onPress={() => {
            setOffset(0);
            setRangeRevision((value) => value + 1);
          }}
          disabled={history.loading || statistics.loading}
        />
        <AppText variant="caption" tone="muted">
          {new Date(range.start).toLocaleString()} to{" "}
          {new Date(range.end).toLocaleString()} (end exclusive)
        </AppText>
      </Section>
      <Section title="Snapshot summary">
        <RequestState
          loading={statistics.loading}
          error={statistics.error}
          refresh={statistics.refresh}
        />
        {summary && <StatisticsCard title={area.name} statistics={summary} />}
        {!statistics.loading && !statistics.error && !summary && (
          <EmptyState
            title="No valid summary readings"
            description="There are no reported-open snapshots with a LastCount in this date range."
          />
        )}
      </Section>
      <Section
        title="Reading history"
        description="Latest valid last reported count per hour, oldest first. Months are labeled once. Each page contains up to 50 snapshots."
      >
        <RequestState
          loading={history.loading}
          error={history.error}
          refresh={history.refresh}
        />
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
