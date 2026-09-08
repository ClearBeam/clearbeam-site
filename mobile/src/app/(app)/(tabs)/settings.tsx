import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { API_BASE_URL } from "@/api/client";
import { radius, spacing, useColors } from "@/theme";

const HOURS: { day: string; hours: string }[] = [
  { day: "Mon – Fri", hours: "7:00 AM – 7:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 5:00 PM" },
  { day: "Sunday", hours: "Emergency calls only" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { session, signOut } = useAuth();

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Business hours" colors={colors}>
          {HOURS.map((row) => (
            <View key={row.day} style={styles.hoursRow}>
              <Text style={[styles.day, { color: colors.text }]}>{row.day}</Text>
              <Text style={[styles.hours, { color: colors.textMuted }]}>{row.hours}</Text>
            </View>
          ))}
        </Section>

        <Section title="Account" colors={colors}>
          <Text style={[styles.value, { color: colors.text }]}>
            {session?.email || "Signed in"}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Server: {API_BASE_URL}</Text>
        </Section>

        <Button label="Log out" variant="secondary" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  hoursRow: { flexDirection: "row", justifyContent: "space-between" },
  day: { fontSize: 15, fontWeight: "600" },
  hours: { fontSize: 15 },
  value: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12 },
});
