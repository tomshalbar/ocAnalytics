import { Stack } from "expo-router";

import { useAppTheme } from "@/theme/use-app-theme";

export const unstable_settings = { initialRouteName: "index" };

export default function HomeLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Home", headerShown: false }}
      />
      <Stack.Screen name="areas/[areaId]" options={{ title: "Area details" }} />
    </Stack>
  );
}
