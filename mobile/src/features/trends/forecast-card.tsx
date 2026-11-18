import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import type { LocationForecast } from "@/data/api/forecasts";
import { formatReadingTime } from "@/data/api/locations";

export function ForecastCard({
  forecast,
  title,
}: {
  forecast: LocationForecast;
  title: string;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const points = forecast.forecast.filter(
    (point) => Date.parse(point.timestamp) > now,
  );
  return (
    <Card>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted">
        Predicted people, not available courts. Times shown in your local time
        zone.
      </AppText>
      <AppText variant="caption">
        Generated: {formatReadingTime(forecast.generated_at)}
      </AppText>
      <AppText variant="caption">
        History through: {formatReadingTime(forecast.data_through)}
      </AppText>
      <AppText variant="caption">
        {forecast.used_fallback
          ? "Baseline forecast (fallback)"
          : `Model: ${forecast.model}`}
      </AppText>
      <View style={styles.row}>
        <AppText variant="label" style={styles.time}>
          Time
        </AppText>
        <AppText variant="label" style={styles.value}>
          People
        </AppText>
        <AppText variant="label" style={styles.value}>
          Lower–upper
        </AppText>
      </View>
      {points.map((point) => (
        <View key={point.timestamp} style={styles.row}>
          <AppText variant="caption" style={styles.time}>
            {formatReadingTime(point.timestamp)}
          </AppText>
          <AppText variant="caption" style={styles.value}>
            {Math.round(point.median)}
          </AppText>
          <AppText variant="caption" style={styles.value}>
            {Math.round(point.lower)}–{Math.round(point.upper)}
          </AppText>
        </View>
      ))}
      {points.length === 0 && (
        <AppText>
          These predictions have passed. Refresh to check for new predictions.
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  time: { flex: 2 },
  value: { flex: 1, textAlign: "right" },
});
