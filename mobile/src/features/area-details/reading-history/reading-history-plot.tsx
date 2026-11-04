import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/theme/tokens";
import { useAppTheme } from "@/theme/use-app-theme";
import type { ReadingMonth } from "./chart-data";

export const PLOT_HEIGHT = 180;
const BAR_SLOT_WIDTH = 18;
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
}: {
  months: ReadingMonth[];
  maximum: number;
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
                <View
                  key={bar.id}
                  accessible
                  accessibilityLabel={`${new Date(bar.collectedAt).toLocaleString()}: last reported count ${bar.count}`}
                  style={styles.barSlot}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (bar.count / maximum) * PLOT_HEIGHT,
                        backgroundColor: colors.accent,
                      },
                    ]}
                  />
                </View>
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
  barSlot: {
    flex: 1,
    minWidth: BAR_SLOT_WIDTH,
    height: PLOT_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  bar: {
    width: "100%",
    maxWidth: 28,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  monthLabel: { textAlign: "left", marginTop: spacing.sm },
});
