import { useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import {
  activityOptions,
  type ActivityFilter,
} from "@/features/areas/activity-options";
import { RecommendationCard } from "./components/recommendation-card";
import { dayOptions, planOptions } from "./plan-options";

export function PlanScreen() {
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [day, setDay] = useState("all");
  const visibleOptions = planOptions.filter(
    ({ recommendation, area }) =>
      (activity === "all" || area.activity === activity) &&
      (day === "all" || recommendation.dayLabel === day),
  );

  return (
    <Screen>
      <ScreenHeading
        title="Plan your visit"
        subtitle="Find a day, time, and place for your next session."
      />
      <DemoNotice />
      <Section title="Activity">
        <ChoiceGroup
          label="Filter visits by activity"
          options={activityOptions}
          value={activity}
          onChange={setActivity}
        />
      </Section>
      <Section title="Day">
        <ChoiceGroup
          label="Filter visits by day"
          options={dayOptions}
          value={day}
          onChange={setDay}
        />
      </Section>
      <Section
        title="Suggested times"
        description={`${visibleOptions.length} sample ${visibleOptions.length === 1 ? "visit" : "visits"} matching your filters.`}
      >
        {visibleOptions.length === 0 ? (
          <EmptyState
            title="No matching visits"
            description="Try another activity or day, or select All areas and All days to see every sample visit."
          />
        ) : (
          visibleOptions.map(({ recommendation, area, gym }) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              areaName={area.name}
              gymName={gym.name}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}
