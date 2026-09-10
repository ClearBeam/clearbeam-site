import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { BUSINESS_PHONE_TEL, getService } from "@/data/services";
import { radius, spacing, useColors } from "@/theme";

export default function ServiceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const service = getService(slug ?? "");

  if (!service) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.textMuted }]}>
            That service wasn't found.
          </Text>
          <Button label="Back to services" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ title: service.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.icon}>{service.icon}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{service.name}</Text>
          <Text style={[styles.tagline, { color: colors.primary }]}>{service.tagline}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {service.description}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Book this service"
            onPress={() => router.push({ pathname: "/book", params: { service: service.slug } })}
          />
          <Button
            label="Call with questions"
            variant="secondary"
            onPress={() => Linking.openURL(BUSINESS_PHONE_TEL)}
          />
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          We service Katy, Richmond, West Houston and the Energy Corridor — at your home or
          office. Final quote confirmed before any work begins.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  center: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: "center" },
  notFound: { fontSize: 16, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  icon: { fontSize: 44 },
  name: { fontSize: 24, fontWeight: "800" },
  tagline: { fontSize: 15, fontWeight: "700" },
  description: { fontSize: 16, lineHeight: 24 },
  actions: { gap: spacing.sm },
  note: { fontSize: 13, lineHeight: 19 },
});
