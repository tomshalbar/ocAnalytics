import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";

type Props = PropsWithChildren<{ title: string; description?: string }>;

export function Section({ title, description, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {description && (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { gap: spacing.xs },
});
