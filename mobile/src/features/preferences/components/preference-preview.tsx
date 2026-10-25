import { StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/chip";
import { spacing } from "@/theme/tokens";

type Props = { options: readonly { label: string; selected: boolean }[] };

export function PreferencePreview({ options }: Props) {
  return (
    <View style={styles.options}>
      {options.map((option) => (
        <Chip key={option.label} {...option} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
