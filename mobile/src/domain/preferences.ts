import type { Activity } from "./area";

export type CrowdComfort = "quiet" | "balanced" | "social";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export type UserPreferences = {
  gymIds: readonly string[];
  activities: readonly Activity[];
  crowdComfort: CrowdComfort;
  timesOfDay: readonly TimeOfDay[];
};
