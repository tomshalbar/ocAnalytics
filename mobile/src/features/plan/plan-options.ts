import { demoAreas } from "@/data/fixtures/areas";
import { demoGyms } from "@/data/fixtures/gyms";
import { demoRecommendations } from "@/data/fixtures/recommendations";
import type { Area } from "@/domain/area";
import type { Gym } from "@/domain/gym";
import type { VisitRecommendation } from "@/domain/recommendation";

export type PlanOption = {
  recommendation: VisitRecommendation;
  area: Area;
  gym: Gym;
};

// Keep sample-data resolution separate from the screen and card presentation.
export const planOptions: readonly PlanOption[] = demoRecommendations.flatMap(
  (recommendation) => {
    const area = demoAreas.find((entry) => entry.id === recommendation.areaId);
    const gym = demoGyms.find((entry) => entry.id === area?.gymId);
    return area && gym ? [{ recommendation, area, gym }] : [];
  },
);

export const dayOptions = [
  { value: "all", label: "All days" },
  ...Array.from(
    new Set(planOptions.map(({ recommendation }) => recommendation.dayLabel)),
    (day) => ({ value: day, label: day }),
  ),
];
