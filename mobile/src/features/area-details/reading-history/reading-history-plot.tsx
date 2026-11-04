import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";
import type { ReadingMonth } from "./chart-data";
import { ReadingHistoryBar } from "./reading-history-bar";

export const PLOT_HEIGHT = 180;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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
      <View style={styles.months}>
        {months.map(({ key, month, bars }) => (
          <View key={key} style={[styles.month, { flexGrow: bars.length }]}>
            <View style={styles.bars}>
              {bars.map((bar) => (
                <ReadingHistoryBar
                  key={bar.id}
                  bar={bar}
                  height={(bar.count / maximum) * PLOT_HEIGHT}
                  selected={bar.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </View>
            <AppText variant="caption" tone="muted" style={styles.monthLabel}>
              {MONTH_LABELS[month - 1]}
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
  months: { flexDirection: "row" },
  month: { minWidth: 32 },
  bars: { height: PLOT_HEIGHT, flexDirection: "row", alignItems: "flex-end" },
  monthLabel: { textAlign: "left", marginTop: spacing.sm },
});
