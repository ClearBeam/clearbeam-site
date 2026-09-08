import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { Button } from "./Button";
import { spacing, useColors } from "@/theme";

/** Loading spinner / error-with-retry / content, for a screen's initial load. */
export function AsyncBoundary({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
}) {
  const colors = useColors();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>{message}</Text>
        <Button label="Try again" variant="secondary" onPress={onRetry} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: { fontSize: 15, textAlign: "center", lineHeight: 21 },
});
