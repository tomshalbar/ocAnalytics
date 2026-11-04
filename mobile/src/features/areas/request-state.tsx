import { ActivityIndicator, Button, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";

export function RequestState({
  loading,
  error,
  refresh,
  showRefresh = true,
  variant = "card",
}: {
  loading: boolean;
  error: string | null;
  refresh: () => void;
  showRefresh?: boolean;
  variant?: "card" | "inline";
}) {
  const { colors } = useAppTheme();

  if (variant === "inline") {
    return (
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator accessibilityLabel="Loading backend data" />
        ) : (
          <View
            style={[
              styles.dot,
              { backgroundColor: error ? colors.busy : colors.quiet },
            ]}
          />
        )}
        <AppText accessibilityLiveRegion="polite" style={styles.message}>
          {loading
            ? "Loading backend data…"
            : error
              ? "We're experiencing a problem. Please try again later."
              : "Backend data loaded"}
        </AppText>
      </View>
    );
  }

  return (
    <Card>
      {loading && (
        <ActivityIndicator accessibilityLabel="Loading backend data" />
      )}
      <AppText accessibilityLiveRegion="polite">
        {loading ? "Loading backend data…" : (error ?? "Backend data loaded")}
      </AppText>
      {(showRefresh || error) && (
        <Button
          title={error ? "Retry" : "Refresh"}
          onPress={refresh}
          disabled={loading}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  message: { flex: 1 },
});
