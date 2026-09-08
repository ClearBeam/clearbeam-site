/**
 * Push-notification setup for the app.
 *
 * `registerForPushNotifications` asks for permission, gets this device's Expo
 * token, and sends it to the API. It degrades quietly: on a simulator (no push
 * token), with permission denied, or with no EAS project id, it just returns —
 * the rest of the app is unaffected.
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken } from "@/api/push";

export const NOTIFICATION_CHANNEL_ID = "default";

/** Show notifications while the app is foregrounded. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function resolveProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators can't get a push token

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: "Bookings",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted ||
      (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) return;

    const projectId = resolveProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await registerPushToken(token);
  } catch (err) {
    // Non-fatal: the app works without push. Surface for debugging only.
    console.warn("push: registration skipped —", err);
  }
}

/** Pull the appointment id out of a notification's `data` payload, if present. */
export function appointmentIdFromNotification(
  response: Notifications.NotificationResponse | null | undefined,
): number | null {
  const data = response?.notification.request.content.data as
    | { appointmentId?: unknown }
    | undefined;
  const id = Number(data?.appointmentId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
