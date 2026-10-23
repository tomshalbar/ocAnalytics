import { AppText } from "@/components/ui/app-text";
import type { AreaObservation } from "@/domain/area";
import {
  availabilityLabel,
  observationStatus,
  observationTime,
} from "./availability-label";

export function ObservationDetails({
  observation,
}: {
  observation: AreaObservation;
}) {
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
        Source updated: {observationTime(observation.sourceUpdatedAt)}
      </AppText>
      <AppText variant="caption" tone="muted">
        Collected: {observationTime(observation.collectedAt)}
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
      <AppText variant="caption" tone="muted">
        Counts do not indicate available courts. Capacity percentage is shown as
        reported; its scale is not yet verified.
      </AppText>
    </>
  );
}
