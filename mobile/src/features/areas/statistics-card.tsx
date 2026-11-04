import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import type { AreaStatistics } from "@/domain/area";
import { observationTime } from "./availability-label";

export function StatisticsCard({
  statistics,
  title,
}: {
  statistics: AreaStatistics;
  title: string;
}) {
  return (
    <Card>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {observationTime(statistics.start)} to {observationTime(statistics.end)}
        {" (end exclusive)"}
      </AppText>
      <AppText>Valid snapshots: {statistics.totalReadings}</AppText>
      <AppText>
        Average last reported count:{" "}
        {statistics.averageLastCount ?? "Not provided"}
      </AppText>
      <AppText>
        Minimum last reported count:{" "}
        {statistics.minimumLastCount ?? "Not provided"}
      </AppText>
      <AppText>
        Maximum last reported count:{" "}
        {statistics.maximumLastCount ?? "Not provided"}
      </AppText>
      <AppText variant="caption" tone="muted">
        Summary of collected snapshots with reported-open status and a non-null
        LastCount. Not unique visits or a time-weighted average.
      </AppText>
    </Card>
  );
}
