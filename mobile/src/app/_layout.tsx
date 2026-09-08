import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/auth/auth-context";
import { configureNotificationHandler } from "@/lib/push";

void SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

function StackWithSplash() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") void SplashScreen.hideAsync();
  }, [status]);

  // Keep the native splash up until the stored session has been checked.
  if (status === "loading") return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <StackWithSplash />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
