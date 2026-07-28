import { Tabs } from "expo-router";
import { Alert, Text } from "react-native";
import { colors } from "@/constants/theme";
import { useRideStore } from "@/store/rideStore";

function TabGlyph({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? colors.primary : colors.muted, fontWeight: "900" }}>{label}</Text>;
}

export default function MemberTabs() {
  const isRecording = useRideStore((state) => state.isRecording);
  const stop = useRideStore((state) => state.stop);
  const confirmLeavingRecording = (event: { preventDefault: () => void }, navigate: () => void) => {
    if (!isRecording) return;
    event.preventDefault();
    Alert.alert("Stop recording?", "Leaving this screen will stop and discard the active ride.", [
      { text: "Keep recording", style: "cancel" },
      { text: "Stop recording", style: "destructive", onPress: () => { stop(); navigate(); } }
    ]);
  };
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted }}>
      <Tabs.Screen name="feed" listeners={({ navigation }) => ({ tabPress: (event) => confirmLeavingRecording(event, () => navigation.navigate("feed")) })} options={{ title: "Home", tabBarIcon: ({ focused }) => <TabGlyph label="H" focused={focused} /> }} />
      <Tabs.Screen name="routes" listeners={({ navigation }) => ({ tabPress: (event) => confirmLeavingRecording(event, () => navigation.navigate("routes")) })} options={{ title: "Routes", tabBarIcon: ({ focused }) => <TabGlyph label="R" focused={focused} /> }} />
      <Tabs.Screen name="record" options={{ title: "REC", tabBarStyle: { display: "none" }, tabBarIcon: ({ focused }) => <TabGlyph label="+" focused={focused} /> }} />
      <Tabs.Screen name="profile" listeners={({ navigation }) => ({ tabPress: (event) => confirmLeavingRecording(event, () => navigation.navigate("profile")) })} options={{ title: "Profile", tabBarIcon: ({ focused }) => <TabGlyph label="P" focused={focused} /> }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
