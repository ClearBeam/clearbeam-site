import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import {
  BUSINESS_PHONE,
  BUSINESS_PHONE_TEL,
  SERVICE_AREA,
  SERVICES,
} from "@/data/services";
import { radius, spacing, useColors } from "@/theme";

const STEPS = [
  { title: "Pick a time", body: "Choose a service and grab an open slot — mornings to evenings." },
  { title: "We come to you", body: "A certified mechanic arrives at your home or office with everything needed." },
  { title: "Pay after the job", body: "No surprises. You approve the work before anything is charged." },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.hero }]}>
          <Text style={[styles.heroKicker, { color: colors.heroText }]}>MOBILE MECHANIC</Text>
          <Text style={[styles.heroTitle, { color: colors.heroText }]}>ClearBeam AutoCare</Text>
          <Text style={[styles.heroSub, { color: colors.heroText }]}>
            We come to your driveway — Katy, Richmond & West Houston.
          </Text>
          <View style={styles.heroActions}>
            <Button label="Book a service" onPress={() => router.push("/book")} />
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openURL(BUSINESS_PHONE_TEL)}
              style={[styles.callButton, { borderColor: "rgba(255,255,255,0.4)" }]}
            >
              <Text style={[styles.callLabel, { color: colors.heroText }]}>
                Call {BUSINESS_PHONE}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Services */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>What we fix</Text>
        <View style={styles.serviceGrid}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.slug}
              accessibilityRole="button"
              onPress={() => router.push(`/service/${service.slug}`)}
              style={({ pressed }) => [
                styles.serviceCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
              <Text style={[styles.serviceTagline, { color: colors.textMuted }]}>
                {service.tagline}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* How it works */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={[styles.stepRow, i > 0 && styles.stepDivider]}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { color: colors.primaryText }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                <Text style={[styles.stepBody, { color: colors.textMuted }]}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Service area */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Where we go</Text>
        <View style={styles.areaRow}>
          {SERVICE_AREA.map((area) => (
            <View
              key={area}
              style={[styles.areaChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.areaText, { color: colors.text }]}>{area}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.areaNote, { color: colors.textMuted }]}>
          Outside the core area? We quote a flat trip charge up front — never a surprise on the
          invoice.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: {
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heroKicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, opacity: 0.7 },
  heroTitle: { fontSize: 30, fontWeight: "800" },
  heroSub: { fontSize: 16, opacity: 0.85, lineHeight: 22 },
  heroActions: { gap: spacing.sm, marginTop: spacing.sm },
  callButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  callLabel: { fontSize: 17, fontWeight: "700" },
  sectionTitle: { fontSize: 20, fontWeight: "800", paddingHorizontal: spacing.lg },
  serviceGrid: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  serviceCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  serviceIcon: { fontSize: 28 },
  serviceName: { fontSize: 16, fontWeight: "700" },
  serviceTagline: { fontSize: 14 },
  card: { marginHorizontal: spacing.lg, borderWidth: 1, borderRadius: radius.md },
  stepRow: { flexDirection: "row", padding: spacing.lg, gap: spacing.md },
  stepDivider: { borderTopWidth: 1, borderTopColor: "rgba(128,128,128,0.2)" },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 16, fontWeight: "800" },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 16, fontWeight: "700" },
  stepBody: { fontSize: 14, lineHeight: 20 },
  areaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  areaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  areaText: { fontSize: 14, fontWeight: "600" },
  areaNote: { fontSize: 13, paddingHorizontal: spacing.lg, lineHeight: 18 },
});
