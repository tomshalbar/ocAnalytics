import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { CrowdBadge } from "@/components/ui/crowd-badge";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { demoAreas, demoObservations } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import { availabilityLabel } from "@/features/areas/availability-label";

export function AreaDetailsScreen({ areaId }: { areaId: string }) {
  const area = demoAreas.find((item) => item.id === areaId);
  if (!area) {
    return (
      <Screen headerShown>
        <EmptyState
          title="Area not found"
          description="This area is not in the demo preview."
        />
        <Link href="/" replace>
          <AppText tone="accent">Return to Home</AppText>
        </Link>
      </Screen>
    );
  }
  const gym = demoGyms.find((item) => item.id === area.gymId);
  const observation = demoObservations.find((item) => item.areaId === area.id);

  return (
    <Screen headerShown>
      <ScreenHeading
        title={area.name}
        eyebrow={gym?.shortName}
        subtitle={`Your ${area.kind}, at a glance.`}
      />
      <DemoNotice />
      <Section title="Availability" description="Sample observation">
        <Card>
          <CrowdBadge level={observation?.crowdLevel ?? "unknown"} />
          <AppText variant="heading">{availabilityLabel(observation)}</AppText>
          <AppText variant="caption" tone="muted">
            Demo snapshot · October 6, 2026
          </AppText>
        </Card>
      </Section>
      <Section title="Typical day">
        <EmptyState
          title="Patterns will appear here"
          description="Historical activity will help you compare quieter and busier hours for this area."
        />
      </Section>
      <Link href="/plan">
        <AppText tone="accent">Explore suggested times →</AppText>
      </Link>
    </Screen>
  );
}
