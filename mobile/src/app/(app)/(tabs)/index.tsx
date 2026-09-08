import { useMemo } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getAppointments } from "@/api/appointments";
import type { Appointment } from "@/api/types";
import { AsyncBoundary } from "@/components/AsyncBoundary";
import { Screen } from "@/components/Screen";
import { StatusPill } from "@/components/StatusPill";
import { groupByDay, isUpcoming } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { radius, spacing, useColors } from "@/theme";

export default function AppointmentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, error, loading, initialLoading, refresh } = useAsync(
    (signal) => getAppointments(signal),
    [],
  );

  const sections = useMemo(
    () => groupByDay((data ?? []).filter(isUpcoming)),
    [data],
  );

  return (
    <Screen edges={["left", "right"]}>
      <AsyncBoundary loading={initialLoading} error={error} onRetry={refresh}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && !initialLoading}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <AppointmentRow
              appointment={item}
              onPress={() => router.push(`/appointment/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No upcoming appointments.
              </Text>
            </View>
          }
        />
      </AsyncBoundary>
    </Screen>
  );
}

function AppointmentRow({
  appointment,
  onPress,
}: {
  appointment: Appointment;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.rowTop}>
        <Text style={[styles.time, { color: colors.text }]}>{appointment.timeLabel}</Text>
        <StatusPill status={appointment.status} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{appointment.name}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {[appointment.service ?? "Service TBD", `ZIP ${appointment.zip}`].join("  ·  ")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { fontSize: 16, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 14 },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyText: { fontSize: 15 },
});
