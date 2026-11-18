import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";
import { useDateTime } from "@/time/date-time-provider";
import type { ReadingMonth } from "./chart-data";
import { ReadingHistoryBar } from "./reading-history-bar";

export const PLOT_HEIGHT = 180;

export function ReadingHistoryPlot({
  months,
  maximum,
  selectedId,
  onSelect,
}: {
  months: ReadingMonth[];
  maximum: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { colors } = useAppTheme();
  const { formatHour } = useDateTime();
  const seenLabels = new Set<string>();
  const readings = months
    .flatMap(({ bars }) => bars)
    .map((bar) => {
      const hour = formatHour(bar.collectedAt);
      const label = seenLabels.has(hour) ? "" : hour;
      seenLabels.add(hour);
      return { bar, label };
    });

  return (
    <View style={styles.plot}>
      <View pointerEvents="none" style={styles.grid}>
        {[0, 1, 2, 3, 4].map((line) => (
          <View
            key={line}
            style={[styles.gridLine, { backgroundColor: colors.border }]}
          />
        ))}
      </View>
      <View style={styles.readings}>
        {readings.map(({ bar, label }) => (
          <View key={bar.id} style={styles.reading}>
            <View style={styles.bar}>
              <ReadingHistoryBar
                bar={bar}
                height={(bar.count / maximum) * PLOT_HEIGHT}
                selected={bar.id === selectedId}
                onSelect={onSelect}
              />
            </View>
            <AppText variant="caption" tone="muted" style={styles.hourLabel}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexGrow: 1 },
  grid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PLOT_HEIGHT,
    justifyContent: "space-between",
  },
  gridLine: { height: StyleSheet.hairlineWidth },
  readings: { flexDirection: "row" },
  reading: { flex: 1, minWidth: 48 },
  bar: { height: PLOT_HEIGHT },
  hourLabel: { textAlign: "center", marginTop: spacing.sm },
});
