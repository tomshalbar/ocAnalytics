import { Link } from "expo-router";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { AppText } from "@/components/ui/app-text";

export default function NotFoundScreen() {
  return (
    <Screen standalone>
      <ScreenHeading
        title="Page not found"
        subtitle="Let’s get you back to your gym."
      />
      <Link href="/" replace>
        <AppText tone="accent">Return to Home</AppText>
      </Link>
    </Screen>
  );
}
