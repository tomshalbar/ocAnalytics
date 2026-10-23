import { Link } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { AppText } from "@/components/ui/app-text";
import { EmptyState } from "@/components/ui/empty-state";

export function PlanScreen() {
  return (
    <Screen>
      <ScreenHeading
        title="Plan your visit"
        subtitle="Use reported activity to explore your options."
      />
      <EmptyState
        title="Suggested times are not available yet"
        description="The backend does not currently provide predictions or personalized recommendations. Explore latest readings and historical snapshot summaries instead."
      />
      <Link href="/">
        <AppText tone="accent">View latest readings →</AppText>
      </Link>
      <Link href="/trends">
        <AppText tone="accent">Explore historical readings →</AppText>
      </Link>
    </Screen>
  );
}
