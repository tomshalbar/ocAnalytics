import type { AreaObservation } from "@/domain/area";

export function availabilityLabel(observation?: AreaObservation) {
  if (!observation) return "No reading available";
  return `Last reported count: ${observation.lastReportedCount ?? "Not provided"}`;
}

export function observationStatus(observation?: AreaObservation) {
  if (!observation) return "Opening status unknown";
  if (observation.sourceIsStale || observation.collectionIsStale)
    return "Outdated reading · current status unconfirmed";
  if (observation.isClosed === true) return "Reported closed";
  if (observation.isClosed === false) return "Reported open";
  return "Opening status unknown";
}

export function observationTime(value: string | null) {
  return value === null ? "Not provided" : new Date(value).toLocaleString();
}
