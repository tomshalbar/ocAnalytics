import { useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { DemoNotice } from "@/components/ui/demo-notice";
import { demoAreas } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import { demoRecommendations } from "@/data/fixtures/recommendations";
import {
  activityOptions,
  type ActivityFilter,
} from "@/features/areas/activity-options";
import { RecommendationCard } from "./components/recommendation-card";

export function PlanScreen() {
  const [activity, setActivity] = useState<ActivityFilter>("all");
  return (
    <Screen>
      <ScreenHeading
        title="Best times for you"
        subtitle="Make room for the things you love to do."
      />
      <DemoNotice />
      <Section title="Choose an activity">
        <ChoiceGroup
          label="Filter suggested times by activity"
          options={activityOptions}
          value={activity}
          onChange={setActivity}
        />
      </Section>
      <Section
        title="Suggested windows"
        description="Example suggestions · personalization coming later"
      >
        {demoRecommendations.map((recommendation) => {
          const area = demoAreas.find(
            (item) => item.id === recommendation.areaId,
          );
          if (!area || (activity !== "all" && area.activity !== activity))
            return null;
          const gym = demoGyms.find((item) => item.id === area.gymId);
          return (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              areaName={area.name}
              gymName={gym?.shortName ?? "Gym"}
            />
          );
        })}
      </Section>
    </Screen>
  );
}
