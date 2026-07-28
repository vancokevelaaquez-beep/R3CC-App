import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/constants/theme";

function TabGlyph({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? colors.primary : colors.muted, fontWeight: "900" }}>{label}</Text>;
}

export default function MemberTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted }}>
      <Tabs.Screen name="feed" options={{ title: "Home", tabBarIcon: ({ focused }) => <TabGlyph label="H" focused={focused} /> }} />
      <Tabs.Screen name="routes" options={{ title: "Routes", tabBarIcon: ({ focused }) => <TabGlyph label="R" focused={focused} /> }} />
      <Tabs.Screen name="record" options={{ title: "REC", tabBarStyle: { display: "none" }, tabBarIcon: ({ focused }) => <TabGlyph label="+" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ focused }) => <TabGlyph label="P" focused={focused} /> }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
