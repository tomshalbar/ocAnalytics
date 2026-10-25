import type { IconName } from "@/components/ui/app-icon";
import type { Activity } from "@/domain/area";

export const activityLabels: Record<Activity, string> = {
  pickleball: "Pickleball",
  tennis: "Tennis",
  "weight-training": "Weights",
};

export const activityIcons: Record<Activity, IconName> = {
  pickleball: "tennisball-outline",
  tennis: "tennisball-outline",
  "weight-training": "barbell-outline",
};

export const activityOptions = [
  { value: "all", label: "All areas" },
  { value: "pickleball", label: "Pickleball" },
  { value: "tennis", label: "Tennis" },
  { value: "weight-training", label: "Weights" },
] as const;

export type ActivityFilter = Activity | "all";
