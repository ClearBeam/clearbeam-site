import { StyleSheet, Text, View } from "react-native";
import type { AppointmentStatus } from "@/api/types";
import { radius, useColors } from "@/theme";

export function StatusPill({ status }: { status: AppointmentStatus }) {
  const colors = useColors();
  const color =
    status === "completed" ? colors.success : status === "cancelled" ? colors.danger : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: colors.pillBg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
});
