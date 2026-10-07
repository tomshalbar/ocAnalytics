import { AppText } from "./app-text";
import { Card } from "./card";

export function DemoNotice() {
  return (
    <Card>
      <AppText variant="label" tone="accent">
        Demo preview
      </AppText>
      <AppText variant="caption" tone="muted">
        Sample data for exploring the app. Availability and suggested times are
        not live.
      </AppText>
    </Card>
  );
}
