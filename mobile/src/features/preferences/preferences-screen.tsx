import { Button } from "react-native";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { demoGyms } from "@/data/fixtures/gyms";
import { demoPreferences } from "@/data/fixtures/preferences";
import { useBackendConnection } from "@/data/api/backend-connection";
import type { CrowdComfort, TimeOfDay } from "@/domain/preferences";
import { activityLabels } from "@/features/areas/activity-options";
import { PreferencePreview } from "./components/preference-preview";

const comfortOptions: readonly { value: CrowdComfort; label: string }[] = [
  { value: "quiet", label: "Quiet" },
  { value: "balanced", label: "Balanced" },
  { value: "social", label: "Social" },
];
const timeOptions: readonly { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export function PreferencesScreen() {
  const connection = useBackendConnection();
  return (
    <Screen>
      <ScreenHeading
        title="Your preferences"
        subtitle="A better gym visit starts with you."
      />
      <Card>
        <AppText variant="label" tone="accent">
          Preference preview
        </AppText>
        <AppText variant="caption" tone="muted">
          Highlighted options show an example profile. Editing and saving will
          be added as this screen develops.
        </AppText>
      </Card>
      <Section title="Your gyms">
        <PreferencePreview
          options={demoGyms.map((gym) => ({
            label: gym.shortName,
            selected: demoPreferences.gymIds.includes(gym.id),
          }))}
        />
      </Section>
      <Section title="Interests">
        <PreferencePreview
          options={Object.entries(activityLabels).map(([value, label]) => ({
            label,
            selected: demoPreferences.activities.some(
              (activity) => activity === value,
            ),
          }))}
        />
      </Section>
      <Section
        title="Crowd comfort"
        description="What feels like a good amount of company?"
      >
        <PreferencePreview
          options={comfortOptions.map(({ value, label }) => ({
            label,
            selected: demoPreferences.crowdComfort === value,
          }))}
        />
      </Section>
      <Section title="Preferred times">
        <PreferencePreview
          options={timeOptions.map(({ value, label }) => ({
            label,
            selected: demoPreferences.timesOfDay.includes(value),
          }))}
        />
      </Section>
      <Section title="Backend connection">
        <Card>
          <AppText accessibilityLiveRegion="polite">
            {connection.status === "checking"
              ? "Checking server connection…"
              : connection.status === "connected"
                ? "Server connection verified"
                : "Server unavailable"}
          </AppText>
          {connection.error && (
            <AppText tone="muted">{connection.error}</AppText>
          )}
          <AppText variant="caption" tone="muted">
            Health check only. Occupancy data is not loaded; screens still use
            demo previews. This check does not verify database availability.
          </AppText>
          <Button
            title="Check connection"
            onPress={connection.retry}
            disabled={connection.status === "checking"}
          />
        </Card>
      </Section>
    </Screen>
  );
}
