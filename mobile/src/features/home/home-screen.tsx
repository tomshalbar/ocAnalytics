import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { demoAreas, demoObservations } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import { AreaCard } from "./components/area-card";

export function HomeScreen() {
  const gym = demoGyms[0];
  return (
    <Screen>
      <ScreenHeading
        eyebrow="OPEN COURT ANALYTICS"
        title="Find your open court."
        subtitle="A little insight. A better time at the gym."
      />
      <DemoNotice />
      <Section title="Right now" description={`${gym.name} · sample snapshot`}>
        {demoAreas
          .filter((area) => area.gymId === gym.id)
          .map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              observation={demoObservations.find(
                (item) => item.areaId === area.id,
              )}
            />
          ))}
      </Section>
    </Screen>
  );
}
