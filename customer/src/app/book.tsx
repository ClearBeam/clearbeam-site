import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { ApiError } from "@/api/client";
import { bookSlot, getAvailability } from "@/api/booking";
import type { AvailabilityDay, BookingResult } from "@/api/types";
import { SERVICES, getService } from "@/data/services";
import { radius, spacing, useColors } from "@/theme";

type Step = "service" | "datetime" | "details" | "review" | "done";

const STEP_TITLES: Record<Exclude<Step, "done">, string> = {
  service: "What do you need?",
  datetime: "Pick a time",
  details: "Your details",
  review: "Review & confirm",
};

export default function BookScreen() {
  const { service: serviceParam } = useLocalSearchParams<{ service?: string }>();
  const router = useRouter();
  const colors = useColors();

  const [step, setStep] = useState<Step>(serviceParam ? "datetime" : "service");
  const [serviceSlug, setServiceSlug] = useState<string | undefined>(serviceParam);
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const service = serviceSlug ? getService(serviceSlug) : undefined;
  const day = days[dayIndex];

  async function loadAvailability() {
    setLoadingDays(true);
    setDaysError(null);
    try {
      const res = await getAvailability();
      setDays(res.days);
      setDayIndex(0);
      setHour(null);
    } catch (err) {
      setDaysError(
        err instanceof ApiError ? err.message : "Couldn't load open times. Try again.",
      );
    } finally {
      setLoadingDays(false);
    }
  }

  useEffect(() => {
    if (step === "datetime" && days.length === 0 && !loadingDays) void loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canPickTime = day && hour !== null;

  function validateDetails(): string | null {
    if (name.trim().length < 2) return "Please enter your name.";
    if (phone.replace(/\D/g, "").length < 7) return "Please enter a valid phone number.";
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) return "Please enter a valid ZIP code.";
    return null;
  }

  async function confirmBooking() {
    const problem = validateDetails();
    if (problem) {
      setFormError(problem);
      setStep("details");
      return;
    }
    if (!day || hour === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await bookSlot({
        date: day.date,
        hour,
        name: name.trim(),
        phone: phone.trim(),
        zip: zip.trim(),
        service: service?.name,
        notes: notes.trim() || undefined,
      });
      setResult(res);
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Slot was taken — refresh availability and send them back to pick again.
        setSubmitError(err.message || "That time just got taken. Pick another one.");
        const refreshed = (err as ApiError & { days?: AvailabilityDay[] }).days;
        if (Array.isArray(refreshed)) {
          setDays(refreshed);
          setDayIndex(0);
          setHour(null);
        } else {
          await loadAvailability();
        }
        setStep("datetime");
      } else {
        setSubmitError(
          err instanceof ApiError ? err.message : "Couldn't complete the booking. Try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stepDots = useMemo(() => ["service", "datetime", "details", "review"] as Step[], []);

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ title: step === "done" ? "Booked!" : STEP_TITLES[step] }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step !== "done" && (
          <View style={styles.dots}>
            {stepDots.map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      stepDots.indexOf(s) <= stepDots.indexOf(step)
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {step === "service" && (
          <View style={styles.gap}>
            {SERVICES.map((s) => {
              const selected = s.slug === serviceSlug;
              return (
                <Pressable
                  key={s.slug}
                  accessibilityRole="button"
                  onPress={() => {
                    setServiceSlug(s.slug);
                    setStep("datetime");
                  }}
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: selected ? 2 : 1,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.optionIcon}>{s.icon}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[styles.optionTag, { color: colors.textMuted }]}>
                      {s.tagline}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === "datetime" && (
          <View style={styles.gap}>
            {loadingDays ? (
              <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
            ) : daysError ? (
              <View style={styles.gap}>
                <Text style={[styles.error, { color: colors.danger }]}>{daysError}</Text>
                <Button label="Try again" onPress={() => void loadAvailability()} />
              </View>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.textMuted }]}>DAY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dayRow}>
                    {days.map((d, i) => {
                      const selected = i === dayIndex;
                      return (
                        <Pressable
                          key={d.date}
                          accessibilityRole="button"
                          onPress={() => {
                            setDayIndex(i);
                            setHour(null);
                          }}
                          style={[
                            styles.dayChip,
                            {
                              backgroundColor: selected ? colors.primary : colors.card,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayLabel,
                              { color: selected ? colors.primaryText : colors.text },
                            ]}
                          >
                            {d.label}
                          </Text>
                          <Text
                            style={[
                              styles.dayCount,
                              { color: selected ? colors.primaryText : colors.textMuted },
                            ]}
                          >
                            {d.slots.length} open
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {day && (
                  <>
                    <Text style={[styles.label, { color: colors.textMuted }]}>TIME</Text>
                    <View style={styles.slotGrid}>
                      {day.slots.map((slot) => {
                        const selected = slot.hour === hour;
                        return (
                          <Pressable
                            key={slot.hour}
                            accessibilityRole="button"
                            onPress={() => setHour(slot.hour)}
                            style={[
                              styles.slot,
                              {
                                backgroundColor: selected ? colors.primary : colors.card,
                                borderColor: selected ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.slotLabel,
                                { color: selected ? colors.primaryText : colors.text },
                              ]}
                            >
                              {slot.label.split(" – ")[0]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={styles.navRow}>
                  <Button label="Back" variant="secondary" onPress={() => setStep("service")} />
                  <View style={styles.navGrow}>
                    <Button
                      label="Continue"
                      disabled={!canPickTime}
                      onPress={() => setStep("details")}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {step === "details" && (
          <View style={styles.gap}>
            {formError && <Text style={[styles.error, { color: colors.danger }]}>{formError}</Text>}
            <Field label="Full name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Jane Smith"
                autoComplete="name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, inputStyle(colors)]}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, inputStyle(colors)]}
              />
            </Field>
            <Field label="ZIP code">
              <TextInput
                value={zip}
                onChangeText={setZip}
                placeholder="77494"
                keyboardType="number-pad"
                autoComplete="postal-code"
                maxLength={10}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, inputStyle(colors)]}
              />
            </Field>
            <Field label="Vehicle & notes (optional)">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. 2019 Honda Civic — grinding noise when braking"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textArea, inputStyle(colors)]}
              />
            </Field>
            <View style={styles.navRow}>
              <Button label="Back" variant="secondary" onPress={() => setStep("datetime")} />
              <View style={styles.navGrow}>
                <Button
                  label="Review booking"
                  onPress={() => {
                    const problem = validateDetails();
                    if (problem) {
                      setFormError(problem);
                      return;
                    }
                    setFormError(null);
                    setStep("review");
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {step === "review" && day && hour !== null && (
          <View style={styles.gap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ReviewRow label="Service" value={service?.name ?? "—"} colors={colors} />
              <ReviewRow label="When" value={`${day.label} · ${slotLabel(day, hour)}`} colors={colors} />
              <ReviewRow label="Name" value={name.trim()} colors={colors} />
              <ReviewRow label="Phone" value={phone.trim()} colors={colors} />
              <ReviewRow label="ZIP" value={zip.trim()} colors={colors} />
              {notes.trim() ? (
                <ReviewRow label="Notes" value={notes.trim()} colors={colors} />
              ) : null}
            </View>
            {submitError && (
              <Text style={[styles.error, { color: colors.danger }]}>{submitError}</Text>
            )}
            <Text style={[styles.finePrint, { color: colors.textMuted }]}>
              No payment due now. We'll confirm your appointment and the final quote before any
              work begins.
            </Text>
            <View style={styles.navRow}>
              <Button label="Back" variant="secondary" onPress={() => setStep("details")} />
              <View style={styles.navGrow}>
                <Button label="Confirm booking" loading={submitting} onPress={() => void confirmBooking()} />
              </View>
            </View>
          </View>
        )}

        {step === "done" && result && (
          <View style={styles.doneWrap}>
            <Text style={styles.doneIcon}>✅</Text>
            <Text style={[styles.doneTitle, { color: colors.text }]}>You're booked!</Text>
            <Text style={[styles.doneSub, { color: colors.textMuted }]}>
              {service?.name} · {result.appointment}
            </Text>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.refLabel, { color: colors.textMuted }]}>BOOKING REFERENCE</Text>
              <Text style={[styles.refValue, { color: colors.text }]}>#{result.id}</Text>
              <Text style={[styles.refHint, { color: colors.textMuted }]}>
                We'll text you at {phone.trim()} to confirm. Need to change anything? Just call
                us.
              </Text>
            </View>
            <Button label="Done" onPress={() => router.replace("/")} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function slotLabel(day: AvailabilityDay, hour: number): string {
  return day.slots.find((s) => s.hour === hour)?.label ?? "";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function inputStyle(colors: ReturnType<typeof useColors>) {
  return {
    color: colors.text,
    borderColor: colors.border,
    backgroundColor: colors.card,
  };
}

function ReviewRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  gap: { gap: spacing.md },
  dots: { flexDirection: "row", gap: spacing.xs, justifyContent: "center" },
  dot: { width: 24, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  error: { fontSize: 14, lineHeight: 20 },
  loader: { marginVertical: spacing.xxl },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  optionIcon: { fontSize: 30 },
  optionText: { flex: 1, gap: 2 },
  optionName: { fontSize: 16, fontWeight: "700" },
  optionTag: { fontSize: 14 },
  dayRow: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
  dayChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
    alignItems: "center",
  },
  dayLabel: { fontSize: 14, fontWeight: "700" },
  dayCount: { fontSize: 12 },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 108,
    alignItems: "center",
  },
  slotLabel: { fontSize: 14, fontWeight: "600" },
  navRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  navGrow: { flex: 1 },
  field: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  textArea: { minHeight: 96, paddingTop: spacing.md },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  reviewRow: { gap: 2 },
  reviewLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  reviewValue: { fontSize: 16 },
  finePrint: { fontSize: 13, lineHeight: 19 },
  doneWrap: { gap: spacing.md, alignItems: "center", paddingTop: spacing.xl },
  doneIcon: { fontSize: 56 },
  doneTitle: { fontSize: 26, fontWeight: "800" },
  doneSub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  refLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textAlign: "center" },
  refValue: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  refHint: { fontSize: 13, lineHeight: 19, textAlign: "center" },
});
