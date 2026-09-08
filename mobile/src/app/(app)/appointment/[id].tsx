import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { getAppointment, updateAppointmentStatus } from "@/api/appointments";
import { ApiError } from "@/api/client";
import type { Appointment } from "@/api/types";
import { AsyncBoundary } from "@/components/AsyncBoundary";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { StatusPill } from "@/components/StatusPill";
import { dialablePhone } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { radius, spacing, useColors } from "@/theme";

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const colors = useColors();

  const { data, error, initialLoading, refresh } = useAsync(
    (signal) => getAppointment(numericId, signal),
    [numericId],
  );

  // Local copy so a status change reflects immediately without a full refetch.
  const [override, setOverride] = useState<Appointment | null>(null);
  const appointment = override ?? data;

  const [pending, setPending] = useState<"completed" | "cancelled" | null>(null);

  async function setStatus(status: "completed" | "cancelled") {
    setPending(status);
    try {
      const updated = await updateAppointmentStatus(numericId, status);
      setOverride(updated);
    } catch (err) {
      Alert.alert(
        "Couldn't update",
        err instanceof ApiError ? err.message : "Please try again.",
      );
    } finally {
      setPending(null);
    }
  }

  function confirmCancel() {
    Alert.alert(
      "Cancel this appointment?",
      "The time slot will be freed up for a new booking.",
      [
        { text: "Keep it", style: "cancel" },
        { text: "Cancel appointment", style: "destructive", onPress: () => setStatus("cancelled") },
      ],
    );
  }

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ title: appointment?.dayLabel ?? "Appointment" }} />
      <AsyncBoundary loading={initialLoading} error={error} onRetry={refresh}>
        {appointment ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <Text style={[styles.time, { color: colors.text }]}>{appointment.timeLabel}</Text>
              <StatusPill status={appointment.status} />
            </View>
            <Text style={[styles.slot, { color: colors.textMuted }]}>{appointment.slotLabel}</Text>

            <Text style={[styles.name, { color: colors.text }]}>{appointment.name}</Text>

            <View style={styles.contactRow}>
              <Button label="Call" onPress={() => Linking.openURL(`tel:${dialablePhone(appointment.phone)}`)} />
              <Button
                label="Text"
                variant="secondary"
                onPress={() => Linking.openURL(`sms:${dialablePhone(appointment.phone)}`)}
              />
            </View>

            <Detail label="Phone" value={appointment.phone} colors={colors} />
            <Detail label="Service" value={appointment.service ?? "Not specified"} colors={colors} />
            <Detail label="ZIP" value={appointment.zip} colors={colors} />
            <Detail
              label="Notes"
              value={appointment.notes?.trim() ? appointment.notes : "None"}
              colors={colors}
            />

            <View style={styles.actions}>
              {appointment.status === "confirmed" ? (
                <Button
                  label="Mark complete"
                  onPress={() => setStatus("completed")}
                  loading={pending === "completed"}
                  disabled={pending !== null}
                />
              ) : null}
              {appointment.status !== "cancelled" ? (
                <Button
                  label="Cancel appointment"
                  variant="danger"
                  onPress={confirmCancel}
                  loading={pending === "cancelled"}
                  disabled={pending !== null}
                />
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

function Detail({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.detail, { borderColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { fontSize: 22, fontWeight: "700" },
  slot: { fontSize: 14 },
  name: { fontSize: 20, fontWeight: "600", marginTop: spacing.sm },
  contactRow: { flexDirection: "row", gap: spacing.md },
  detail: { borderTopWidth: 1, paddingTop: spacing.sm, gap: 2 },
  detailLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 16, lineHeight: 22 },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
