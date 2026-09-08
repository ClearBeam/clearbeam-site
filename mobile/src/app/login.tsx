import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { radius, spacing, useColors } from "@/theme";

export default function LoginScreen() {
  const { status, signIn } = useAuth();
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") return <Redirect href="/(app)" />;

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      // On success the root layout swaps to the app automatically.
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't sign in. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>ClearBeam</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Owner sign in
            </Text>
          </View>

          <View style={styles.form}>
            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                placeholder="you@clearbeamandautocare.com"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />
            </Field>

            <Field label="Password">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => canSubmit && onSubmit()}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />
            </Field>

            {error ? (
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            ) : null}

            <Button
              label="Sign in"
              onPress={onSubmit}
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
  header: { gap: spacing.xs },
  title: { fontSize: 32, fontWeight: "700" },
  subtitle: { fontSize: 16 },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  error: { fontSize: 14 },
});
