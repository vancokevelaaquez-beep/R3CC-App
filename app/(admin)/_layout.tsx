import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/constants/theme";

function TabGlyph({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? colors.primary : colors.muted, fontWeight: "900" }}>{label}</Text>;
}

export default function AdminTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ focused }) => <TabGlyph label="D" focused={focused} /> }} />
      <Tabs.Screen name="members" options={{ title: "Members", tabBarIcon: ({ focused }) => <TabGlyph label="M" focused={focused} /> }} />
      <Tabs.Screen name="applications" options={{ title: "Applicants", tabBarIcon: ({ focused }) => <TabGlyph label="A" focused={focused} /> }} />
      <Tabs.Screen name="rides" options={{ title: "Rides", tabBarIcon: ({ focused }) => <TabGlyph label="R" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ focused }) => <TabGlyph label="S" focused={focused} /> }} />
    </Tabs>
  );
}
