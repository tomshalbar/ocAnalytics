import { useColorScheme } from "react-native";

import { colors } from "./colors";

export function useAppTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { colors: colors[scheme], scheme };
}
