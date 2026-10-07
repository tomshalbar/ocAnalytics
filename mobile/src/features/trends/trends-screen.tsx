import { useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { EmptyState } from "@/components/ui/empty-state";
import {
  activityLabels,
  activityOptions,
  type ActivityFilter,
} from "@/features/areas/activity-options";

export function TrendsScreen() {
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const subject =
    activity === "all"
      ? "your gym areas"
      : activityLabels[activity].toLowerCase();
  return (
    <Screen>
      <ScreenHeading
        title="Weekly patterns"
        subtitle="Get to know the rhythm of your gym."
      />
      <Section title="Choose an activity">
        <ChoiceGroup
          label="Filter weekly patterns by activity"
          options={activityOptions}
          value={activity}
          onChange={setActivity}
        />
      </Section>
      <Section title="A week at a glance">
        <EmptyState
          title="Building the bigger picture"
          description={`Once historical data is connected, compare activity across days and hours for ${subject}.`}
        />
      </Section>
      <Section title="Insights">
        <EmptyState
          icon="bulb-outline"
          title="Your next good time to go"
          description="Recurring quiet windows and peak hours will appear here as patterns become available."
        />
      </Section>
    </Screen>
  );
}
