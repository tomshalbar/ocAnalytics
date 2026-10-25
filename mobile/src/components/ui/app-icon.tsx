import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { useAppTheme } from "@/theme/use-app-theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = { name: IconName; size?: number; color?: ColorValue };

export function AppIcon({ name, size = 22, color }: Props) {
  const { colors } = useAppTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? colors.muted}
      accessible={false}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
