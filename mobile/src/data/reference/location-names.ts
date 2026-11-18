import { locationNames } from "./location-names.generated.ts";

export function locationName(locationId: number): string {
  return locationNames[locationId] ?? `Location ${locationId}`;
}
