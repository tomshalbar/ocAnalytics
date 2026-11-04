import { ActivityIndicator, Button } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";

export function RequestState({
  loading,
  error,
  refresh,
}: {
  loading: boolean;
  error: string | null;
  refresh: () => void;
}) {
  return (
    <Card>
      {loading && (
        <ActivityIndicator accessibilityLabel="Loading backend data" />
      )}
      <AppText accessibilityLiveRegion="polite">
        {loading ? "Loading backend data…" : (error ?? "Backend data loaded")}
      </AppText>
      <Button
        title={error ? "Retry" : "Refresh"}
        onPress={refresh}
        disabled={loading}
      />
    </Card>
  );
}
