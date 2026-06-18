import { ScrollView, StyleSheet, Text } from "react-native";
import { RideCard } from "@/components/RideCard";
import { colors, spacing } from "@/constants/theme";
import { rides } from "@/lib/mockData";

export default function AdminRideFeedScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ride Feed</Text>
      {rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" }
});
