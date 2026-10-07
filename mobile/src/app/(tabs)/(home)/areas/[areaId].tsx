import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { AppText } from "@/components/ui/app-text";

export default function AreaDetailsRoute() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  return (
    <Screen headerShown>
      <ScreenHeading
        title="Area details"
        subtitle="Availability and patterns are coming next."
      />
      <AppText tone="muted">Area: {areaId}</AppText>
    </Screen>
  );
}
