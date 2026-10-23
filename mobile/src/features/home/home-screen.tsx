import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { demoAreas, demoObservations } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import type { Area, AreaObservation } from "@/domain/area";
import { AreaCard } from "./components/area-card";

type Props = {
  areas?: readonly Area[];
  observations?: readonly AreaObservation[];
  isDemo?: boolean;
};

export function HomeScreen({
  areas = demoAreas,
  observations = demoObservations,
  isDemo = true,
}: Props) {
  const gym = demoGyms[0];
  return (
    <Screen>
      <ScreenHeading
        eyebrow="OPEN COURT ANALYTICS"
        title="Find your open court."
        subtitle="A little insight. A better time at the gym."
      />
      {isDemo && <DemoNotice />}
      <Section
        title="Latest readings"
        description={`${gym.name}${isDemo ? " · sample snapshots" : ""}`}
      >
        {areas
          .filter((area) => area.gymId === gym.id)
          .map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              observation={observations.find((item) => item.areaId === area.id)}
            />
          ))}
      </Section>
    </Screen>
  );
}
