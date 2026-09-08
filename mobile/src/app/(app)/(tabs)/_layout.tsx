import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useColors } from "@/theme";

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color }) => <TabGlyph label="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabGlyph label="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabGlyph({ label, color }: { label: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{label}</Text>;
}
