import { Pressable, StyleSheet, View } from "react-native";

import { radius, spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";
import { AppText } from "./app-text";

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected = false, onPress }: Props) {
  const { colors } = useAppTheme();
  const style = [
    styles.chip,
    {
      backgroundColor: selected ? colors.accentSurface : colors.surface,
      borderColor: selected ? colors.accent : colors.border,
    },
  ];
  const content = (
    <AppText variant="label" tone={selected ? "accent" : "muted"}>
      {label}
    </AppText>
  );

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
});
