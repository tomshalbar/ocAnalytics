import { Pressable, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/theme/use-app-theme";
import type { ReadingBar } from "./chart-data";

export function ReadingHistoryBar({
  bar,
  height,
  selected,
  onSelect,
}: {
  bar: ReadingBar;
  height: number;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${new Date(bar.collectedAt).toLocaleString()}: last reported count ${bar.count}`}
      accessibilityHint="Show the count, date, and time below the graph"
      accessibilityState={{ selected }}
      onPress={() => onSelect(bar.id)}
      style={[
        styles.slot,
        { backgroundColor: selected ? colors.border : "transparent" },
      ]}
    >
      <View style={[styles.bar, { height, backgroundColor: colors.accent }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    minWidth: 18,
    height: "100%",
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
});
