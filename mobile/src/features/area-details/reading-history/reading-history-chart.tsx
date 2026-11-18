import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { LocationReading } from "@/data/api/location-contracts";
import { RECENT_READING_LIMIT } from "@/data/api/location-contracts";
import { spacing } from "@/theme/tokens";
import { useDateTime } from "@/time/date-time-provider";
import { buildReadingChart } from "./chart-data";
import { ReadingHistoryPlot, PLOT_HEIGHT } from "./reading-history-plot";

export function ReadingHistoryChart({
  readings,
}: {
  readings: readonly LocationReading[];
}) {
  const dateTime = useDateTime();
  const chart = useMemo(
    () => buildReadingChart(readings, dateTime),
    [readings, dateTime],
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = chart.months
    .flatMap((month) => month.bars)
    .find((bar) => bar.id === selectedId);

  if (chart.months.length === 0)
    return (
      <EmptyState
        title="No reported counts to graph"
        description="The most recent snapshots do not contain valid last reported counts."
      />
    );

  return (
    <Card>
      <AppText variant="label">
        {RECENT_READING_LIMIT} Most Recent Readings
      </AppText>
      <View style={styles.chart}>
        <View style={styles.axis}>
          {chart.ticks.map((tick) => (
            <AppText key={tick} variant="caption" tone="muted">
              {tick.toLocaleString()}
            </AppText>
          ))}
        </View>
        <ScrollView
          horizontal
          style={styles.scroll}
          contentContainerStyle={styles.content}
          accessibilityLabel="Reading history. Scroll horizontally to explore snapshots."
        >
          <ReadingHistoryPlot
            months={chart.months}
            maximum={chart.maximum}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
        </ScrollView>
      </View>
      <AppText variant="caption" tone="muted" style={styles.axisTitle}>
        Hour
      </AppText>
      <AppText variant="caption" accessibilityLiveRegion="polite">
        {selected
          ? `Last reported count: ${selected.count} — ${dateTime.formatDateTime(selected.collectedAt)}`
          : "Tap a bar to see its last reported count, date, and time."}
      </AppText>
      {chart.omittedCount > 0 && (
        <AppText variant="caption" tone="muted">
          {chart.omittedCount} snapshots without a valid last reported count are
          omitted.
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm },
  axis: {
    height: PLOT_HEIGHT + 20,
    marginTop: -10,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.sm },
  axisTitle: { textAlign: "center" },
});
