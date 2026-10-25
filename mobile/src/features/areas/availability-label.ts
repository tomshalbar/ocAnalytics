import type { AreaObservation } from "@/domain/area";

export function availabilityLabel(observation?: AreaObservation) {
  if (!observation) return "Availability not yet available";
  if (observation.availableUnits === null)
    return "Space availability not measured";
  return `${observation.availableUnits} of ${observation.totalUnits} ${observation.unitLabel} open`;
}
