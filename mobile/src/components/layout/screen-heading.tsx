import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";

type Props = { title: string; subtitle: string; eyebrow?: string };

export function ScreenHeading({ title, subtitle, eyebrow }: Props) {
  return (
    <View style={styles.container}>
      {eyebrow && (
        <AppText variant="label" tone="accent">
          {eyebrow}
        </AppText>
      )}
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText tone="muted">{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.sm } });
