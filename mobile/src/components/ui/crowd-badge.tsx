import { StyleSheet, View } from "react-native";

import type { CrowdLevel } from "@/domain/area";
import { radius, spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";
import { AppText } from "./app-text";

const labels: Record<CrowdLevel, string> = {
  quiet: "Quiet",
  moderate: "Moderate",
  busy: "Busy",
  unknown: "No data",
};

export function CrowdBadge({ level }: { level: CrowdLevel }) {
  const { colors } = useAppTheme();
  const color = level === "unknown" ? colors.muted : colors[level];
  const backgroundColor =
    level === "unknown" ? colors.background : colors[`${level}Surface`];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <AppText variant="caption" style={{ color, fontWeight: "600" }}>
        {labels[level]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
