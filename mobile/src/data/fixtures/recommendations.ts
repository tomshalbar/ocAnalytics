import type { VisitRecommendation } from "@/domain/recommendation";

export const demoRecommendations: readonly VisitRecommendation[] = [
  {
    id: "pickleball-morning",
    areaId: "southwest-pickleball",
    dayLabel: "Saturday",
    timeLabel: "9–10 AM",
    expectedCrowd: "quiet",
    reason: "An example of a quieter morning window.",
  },
  {
    id: "tennis-morning",
    areaId: "southwest-tennis",
    dayLabel: "Sunday",
    timeLabel: "8–9 AM",
    expectedCrowd: "quiet",
    reason: "An example of a low-crowd court session.",
  },
  {
    id: "weights-evening",
    areaId: "southwest-weights",
    dayLabel: "Tuesday",
    timeLabel: "8–9 PM",
    expectedCrowd: "moderate",
    reason: "An example of a balanced evening window.",
  },
];
