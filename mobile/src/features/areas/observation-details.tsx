import { AppText } from "@/components/ui/app-text";
import type { AreaObservation } from "@/domain/area";
import { useDateTime } from "@/time/date-time-provider";
import { availabilityLabel, observationStatus } from "./availability-label";

export function ObservationDetails({
  observation,
}: {
  observation: AreaObservation;
}) {
  const { formatDateTime } = useDateTime();
  return (
    <>
      <AppText>{observationStatus(observation)}</AppText>
      <AppText variant="heading">{availabilityLabel(observation)}</AppText>
      <AppText>
        Reported participants: {observation.participantCount ?? "Not provided"}
      </AppText>
      <AppText>
        Reported capacity percentage:{" "}
        {observation.reportedCapacityPercentage ?? "Not provided"}
      </AppText>
      <AppText variant="caption" tone="muted">
        Source updated: {formatDateTime(observation.sourceUpdatedAt)}
      </AppText>
      <AppText variant="caption" tone="muted">
        Collected: {formatDateTime(observation.collectedAt)}
      </AppText>
      <AppText variant="caption" tone="muted">
        Source freshness:{" "}
        {observation.sourceIsStale
          ? "Outdated or missing update"
          : "Within freshness window"}
      </AppText>
      <AppText variant="caption" tone="muted">
        Collection freshness:{" "}
        {observation.collectionIsStale ? "Outdated" : "Within freshness window"}
      </AppText>
    </>
  );
}
