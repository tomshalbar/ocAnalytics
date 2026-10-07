import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/tokens";
import { Chip } from "./chip";

type Props<Value extends string> = {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
};

export function ChoiceGroup<Value extends string>({
  label,
  options,
  value,
  onChange,
}: Props<Value>) {
  return (
    <View style={styles.choices} accessibilityLabel={label}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
