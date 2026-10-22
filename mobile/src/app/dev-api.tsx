import { useState } from "react";
import { Button, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { useLocations } from "@/data/api/use-locations";
import {
  formatReadingTime,
  readingStatus,
  getRequestTimeoutMs,
} from "@/data/api/locations";

function ApiProbe() {
  const [locationId, setLocationId] = useState<string | undefined>();
  const [knownId, setKnownId] = useState<string>();
  const { rows, loading, error, notFound, refresh } = useLocations(locationId);
  const first = rows[0];
  const selectFirst = () => {
    if (first) {
      const id = String(first.LocationId);
      setKnownId(id);
      setLocationId(id);
    }
  };
  return (
    <Screen headerShown>
      <Stack.Screen options={{ title: "API test (development)" }} />
      <AppText variant="title">Backend connection test</AppText>
      <AppText variant="caption">
        Temporary developer tool. Home and tabs still use their original demo
        data.
      </AppText>
      <Card>
        <AppText>
          Backend: {process.env.EXPO_PUBLIC_API_URL || "Not configured"}
        </AppText>
        <AppText>
          Request:{" "}
          {locationId === undefined
            ? "/locations/latest"
            : `/locations/${locationId}/latest`}
        </AppText>
        <AppText accessibilityLiveRegion="polite">
          {loading
            ? "Loading…"
            : error
              ? `${notFound ? "404: " : "Error: "}${error}`
              : `Success: ${rows.length} reading(s)`}
        </AppText>
        <Button title="Refresh / Retry" onPress={refresh} disabled={loading} />
        <Button
          title="1. Fetch all locations"
          onPress={() => {
            setLocationId(undefined);
            refresh();
          }}
          disabled={loading}
        />
        <Button
          title="2. Fetch first location"
          onPress={selectFirst}
          disabled={loading || !first || locationId !== undefined}
        />
        <Button
          title="3. Test missing location (404)"
          onPress={() => setLocationId("2147483647")}
          disabled={loading}
        />
        {knownId && (
          <Button
            title="Return to known location"
            onPress={() => {
              setLocationId(knownId);
              refresh();
            }}
            disabled={loading}
          />
        )}
      </Card>
      {first && !loading && !error && (
        <Card>
          <AppText variant="heading">Location {first.LocationId}</AppText>
          <AppText>Last reported count: {first.LastCount ?? "Unknown"}</AppText>
          <AppText>{readingStatus(first)}</AppText>
          <AppText>
            Source updated: {formatReadingTime(first.LastUpdatedDateAndTime)}
          </AppText>
          <AppText>Collected: {formatReadingTime(first.runDatetime)}</AppText>
        </Card>
      )}
      <View>
        <AppText variant="heading">Connection recovery test</AppText>
        <AppText>
          Stop only Uvicorn on the computer, then tap Refresh. Expect an error
          within {getRequestTimeoutMs() / 1000} seconds. Restart Uvicorn and tap
          Retry; expect success. Keep Expo running.
        </AppText>
      </View>
    </Screen>
  );
}

export default function DevApiScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ApiProbe />;
}
