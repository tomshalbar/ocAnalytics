import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import type { AreaStatistics } from "@/domain/area";

function observationDate(value: string | null) {
  return value === null ? "Not provided" : new Date(value).toLocaleDateString();
}

export function StatisticsCard({
  statistics,
  title,
  compactCounts = false,
}: {
  statistics: AreaStatistics;
  title: string;
  compactCounts?: boolean;
}) {
  const counts = [
    {
      label: "Average last reported count",
      shortLabel: "Avg Count",
      value: statistics.averageLastCount,
    },
    {
      label: "Minimum last reported count",
      shortLabel: "Min Count",
      value: statistics.minimumLastCount,
    },
    {
      label: "Maximum last reported count",
      shortLabel: "Max Count",
      value: statistics.maximumLastCount,
    },
  ];

  return (
    <Card>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted">
        Readings from {observationDate(statistics.start)} to{" "}
        {observationDate(statistics.end)}
      </AppText>
      {compactCounts ? (
        <View style={styles.countsRow}>
          {counts.map(({ shortLabel, value }) => (
            <View key={shortLabel} style={styles.countColumn}>
              <AppText variant="label">{shortLabel}</AppText>
              <AppText>{value ?? "Not provided"}</AppText>
            </View>
          ))}
        </View>
      ) : (
        counts.map(({ label, value }) => (
          <AppText key={label}>
            {label}: {value ?? "Not provided"}
          </AppText>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  countsRow: {
    flexDirection: "row",
    width: "100%",
  },
  countColumn: {
    flex: 1,
    alignItems: "center",
  },
});
