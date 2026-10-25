import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { maxContentWidth, spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";

type Props = PropsWithChildren<{ headerShown?: boolean; standalone?: boolean }>;

export function Screen({
  children,
  headerShown = false,
  standalone = false,
}: Props) {
  const { colors } = useAppTheme();
  // Navigator headers and the non-overlay tab bar own their respective insets.
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={
        standalone
          ? ["top", "left", "right", "bottom"]
          : headerShown
            ? ["left", "right"]
            : ["top", "left", "right"]
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
});
