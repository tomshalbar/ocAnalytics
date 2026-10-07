import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { CrowdBadge } from "@/components/ui/crowd-badge";
import type { VisitRecommendation } from "@/domain/recommendation";

type Props = {
  recommendation: VisitRecommendation;
  areaName: string;
  gymName: string;
};

export function RecommendationCard({
  recommendation,
  areaName,
  gymName,
}: Props) {
  return (
    <Card>
      <AppText variant="heading">
        {recommendation.dayLabel} · {recommendation.timeLabel}
      </AppText>
      <AppText variant="label">
        {areaName} · {gymName}
      </AppText>
      <CrowdBadge level={recommendation.expectedCrowd} />
      <AppText variant="caption" tone="muted">
        {recommendation.reason}
      </AppText>
    </Card>
  );
}
