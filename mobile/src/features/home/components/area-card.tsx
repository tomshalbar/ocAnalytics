import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import type { Area, AreaObservation } from "@/domain/area";
import { activityIcons } from "@/features/areas/activity-options";
import {
  availabilityLabel,
  observationStatus,
} from "@/features/areas/availability-label";
import { spacing } from "@/theme/tokens";

type Props = { area: Area; observation?: AreaObservation };

export function AreaCard({ area, observation }: Props) {
  return (
    <Link
      href={{ pathname: "/areas/[areaId]", params: { areaId: area.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${area.name}, ${observationStatus(observation)}, ${availabilityLabel(observation)}`}
        accessibilityHint="Open area readings and history"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card>
          <View style={styles.row}>
            <AppIcon name={activityIcons[area.activity]} />
            <AppText variant="heading" style={styles.name}>
              {area.name}
            </AppText>
            <AppIcon name="chevron-forward" size={18} />
          </View>
          <AppText>{observationStatus(observation)}</AppText>
          <AppText tone="muted">{availabilityLabel(observation)}</AppText>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { flex: 1 },
  pressed: { opacity: 0.7 },
});
