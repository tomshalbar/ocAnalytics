import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/theme/use-app-theme";
import { BackendConnectionProvider } from "@/data/api/backend-connection";
import { usePrefetchAppData } from "@/data/api/use-prefetch-app-data";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  usePrefetchAppData();
  const { colors, scheme } = useAppTheme();
  const baseTheme = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <BackendConnectionProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </BackendConnectionProvider>
    </ThemeProvider>
  );
}
