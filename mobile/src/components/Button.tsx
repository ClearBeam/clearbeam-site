import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { radius, spacing, useColors } from "@/theme";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.card;
  const fg =
    variant === "secondary" ? colors.text : variant === "danger" ? "#FFFFFF" : colors.primaryText;
  const border = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  label: { fontSize: 16, fontWeight: "600" },
});
