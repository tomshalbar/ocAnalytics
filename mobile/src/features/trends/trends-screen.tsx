import { useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { EmptyState } from "@/components/ui/empty-state";
import { demoAreas } from "@/data/fixtures/areas";
import type { Area, AreaStatistics } from "@/domain/area";
import { StatisticsCard } from "@/features/areas/statistics-card";
import {
  activityLabels,
  activityOptions,
  type ActivityFilter,
} from "@/features/areas/activity-options";

type Props = {
  areas?: readonly Area[];
  statistics?: readonly AreaStatistics[];
};

export function TrendsScreen({ areas = demoAreas, statistics = [] }: Props) {
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const subject =
    activity === "all"
      ? "your gym areas"
      : activityLabels[activity].toLowerCase();
  const summaries = areas
    .filter((area) => activity === "all" || area.activity === activity)
    .flatMap((area) => {
      const summary = statistics.find((item) => item.areaId === area.id);
      return summary ? [{ area, summary }] : [];
    });
  return (
    <Screen>
      <ScreenHeading
        title="Historical readings"
        subtitle="Compare reported counts over a date range."
      />
      <Section title="Choose an activity">
        <ChoiceGroup
          label="Filter historical readings by activity"
          options={activityOptions}
          value={activity}
          onChange={setActivity}
        />
      </Section>
      <Section title="Snapshot summaries">
        {summaries.length ? (
          summaries.map(({ area, summary }) => (
            <StatisticsCard
              key={area.id}
              title={area.name}
              statistics={summary}
            />
          ))
        ) : (
          <EmptyState
            title="No summaries populated"
            description={`Date-range summaries for ${subject} will show valid snapshots and average, minimum, and maximum last reported counts.`}
          />
        )}
      </Section>
      <Section title="Insights">
        <EmptyState
          icon="bulb-outline"
          title="Patterns are not yet available"
          description="Snapshot summaries do not provide hourly patterns, crowd predictions, or suggested visit times."
        />
      </Section>
    </Screen>
  );
}
