import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { demoAreas, demoObservations } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import type { Area, AreaObservation, AreaStatistics } from "@/domain/area";
import { ObservationDetails } from "@/features/areas/observation-details";
import { StatisticsCard } from "@/features/areas/statistics-card";

type Props = {
  areaId: string;
  areas?: readonly Area[];
  observations?: readonly AreaObservation[];
  history?: readonly AreaObservation[];
  statistics?: AreaStatistics;
  isDemo?: boolean;
};

export function AreaDetailsScreen({
  areaId,
  areas = demoAreas,
  observations = demoObservations,
  history,
  statistics,
  isDemo = true,
}: Props) {
  const area = areas.find((item) => item.id === areaId);
  if (!area) {
    return (
      <Screen headerShown>
        <EmptyState
          title="Area not found"
          description="This area is not in the area catalog."
        />
        <Link href="/" replace>
          <AppText tone="accent">Return to Home</AppText>
        </Link>
      </Screen>
    );
  }
  const gym = demoGyms.find((item) => item.id === area.gymId);
  const observation = observations.find((item) => item.areaId === area.id);
  const areaHistory = history?.filter((item) => item.areaId === area.id);

  return (
    <Screen headerShown>
      <ScreenHeading
        title={area.name}
        eyebrow={gym?.shortName}
        subtitle={`Your ${area.kind}, at a glance.`}
      />
      {isDemo && <DemoNotice />}
      <Section
        title="Latest reading"
        description={isDemo ? "Sample observation" : undefined}
      >
        <Card>
          {observation ? (
            <ObservationDetails observation={observation} />
          ) : (
            <AppText>No reading available</AppText>
          )}
        </Card>
      </Section>
      <Section title="Snapshot summary">
        {statistics?.areaId === area.id ? (
          <StatisticsCard title={area.name} statistics={statistics} />
        ) : (
          <EmptyState
            title="No summary available"
            description="Summary data will show the average, minimum, and maximum LastCount for the requested date range."
          />
        )}
      </Section>
      <Section
        title="Reading history"
        description="Collected snapshots for the requested range and page."
      >
        {areaHistory?.length ? (
          areaHistory.map((item) => (
            <Card key={item.readingId}>
              <ObservationDetails observation={item} />
            </Card>
          ))
        ) : (
          <EmptyState
            title={
              history === undefined
                ? "History not populated"
                : "No readings in this page"
            }
            description="History uses collection time, not unique source updates. An empty page does not establish that the area was closed."
          />
        )}
      </Section>
      <Link href="/plan">
        <AppText tone="accent">Explore suggested times →</AppText>
      </Link>
    </Screen>
  );
}
