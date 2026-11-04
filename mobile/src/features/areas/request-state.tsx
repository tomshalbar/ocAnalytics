import { ActivityIndicator, Button } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";

export function RequestState({
  loading,
  error,
  refresh,
  showRefresh = true,
}: {
  loading: boolean;
  error: string | null;
  refresh: () => void;
  showRefresh?: boolean;
}) {
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
