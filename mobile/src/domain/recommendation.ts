import type { CrowdLevel } from "./area";

export type VisitRecommendation = {
  id: string;
  areaId: string;
  dayLabel: string;
  timeLabel: string;
  expectedCrowd: CrowdLevel;
  reason: string;
};
