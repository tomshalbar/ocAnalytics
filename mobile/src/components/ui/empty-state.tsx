import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/tokens";
import { AppIcon, type IconName } from "./app-icon";
import { AppText } from "./app-text";
import { Card } from "./card";

type Props = { title: string; description: string; icon?: IconName };

export function EmptyState({
  title,
  description,
  icon = "analytics-outline",
}: Props) {
  return (
    <Card>
      <View style={styles.icon}>
        <AppIcon name={icon} size={28} />
      </View>
      <AppText variant="heading">{title}</AppText>
      <AppText tone="muted">{description}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({ icon: { marginBottom: spacing.sm } });
