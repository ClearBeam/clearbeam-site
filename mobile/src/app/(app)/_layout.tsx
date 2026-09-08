import { useEffect, useRef } from "react";
import { Redirect, Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/auth/auth-context";
import { appointmentIdFromNotification, registerForPushNotifications } from "@/lib/push";
import { useColors } from "@/theme";

/** Signed-in area. Everything under here requires a session; the tab bar lives
 *  in the nested (tabs) group, and the appointment detail screen pushes on top. */
export default function AppLayout() {
  const { status } = useAuth();
  const colors = useColors();
  const router = useRouter();

  // Register this device for push once we have a session.
  useEffect(() => {
    if (status === "authenticated") void registerForPushNotifications();
  }, [status]);

  // Tapping a booking notification (cold or warm start) opens that appointment.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !lastResponse) return;
    const key = lastResponse.notification.request.identifier;
    if (handled.current === key) return;
    handled.current = key;
    const id = appointmentIdFromNotification(lastResponse);
    if (id) router.push(`/appointment/${id}`);
  }, [status, lastResponse, router]);

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
