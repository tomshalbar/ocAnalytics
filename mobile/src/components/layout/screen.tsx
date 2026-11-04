import type { PropsWithChildren } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBackendConnection } from "@/data/api/backend-connection";
import { maxContentWidth, spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";

type Props = PropsWithChildren<{
  headerShown?: boolean;
  standalone?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({
  children,
  headerShown = false,
  standalone = false,
  refreshing,
  onRefresh,
}: Props) {
  const { colors } = useAppTheme();
  const connection = useBackendConnection();
  const handleRefresh = onRefresh ?? connection.retry;
  const isRefreshing = refreshing ?? connection.status === "checking";
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
        alwaysBounceVertical
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
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
