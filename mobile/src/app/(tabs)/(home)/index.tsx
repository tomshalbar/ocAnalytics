import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { AppText } from "@/components/ui/app-text";

export default function HomeRoute() {
  return (
    <Screen>
      <ScreenHeading title="Home" subtitle="Gym availability is coming next." />
      <Link
        href={{
          pathname: "/areas/[areaId]",
          params: { areaId: "southwest-pickleball" },
        }}
      >
        <AppText tone="accent">Preview area details →</AppText>
      </Link>
    </Screen>
  );
}
