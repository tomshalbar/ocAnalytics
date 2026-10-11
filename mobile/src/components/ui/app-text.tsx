import { StyleSheet, Text, type TextProps } from "react-native";

import { useAppTheme } from "@/theme/use-app-theme";

type Props = TextProps & {
  variant?: "title" | "heading" | "body" | "caption" | "label";
  tone?: "default" | "muted" | "accent";
};

export function AppText({
  variant = "body",
  tone = "default",
  style,
  ...props
}: Props) {
  const { colors } = useAppTheme();
  const color = tone === "default" ? colors.text : colors[tone];

  return <Text {...props} style={[styles[variant], { color }, style]} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 14, lineHeight: 21, fontWeight: "600" },
});
