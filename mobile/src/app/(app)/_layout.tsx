import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/auth/auth-context";
import { useColors } from "@/theme";

/** Signed-in area. Everything under here requires a session; the tab bar lives
 *  in the nested (tabs) group, and the appointment detail screen pushes on top. */
export default function AppLayout() {
  const { status } = useAuth();
  const colors = useColors();

  if (status !== "authenticated") return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="appointment/[id]" options={{ title: "Appointment" }} />
    </Stack>
  );
}
