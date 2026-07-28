import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { GroupRide } from "@/lib/types";

export function GroupRideCard({ ride }: { ride: GroupRide }) {
  const date = new Date(ride.scheduled_at).toLocaleDateString();

  return (
    <Pressable style={styles.card}>
      <View style={styles.icon}><Text style={styles.iconText}>R</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{ride.title}</Text>
        <Text style={styles.meta}>{date} | {ride.distance_km} km | {ride.rsvp_count ?? 0} going</Text>
        <Text style={styles.location}>{ride.meet_location}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  iconText: { color: colors.text, fontWeight: "900" },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: "900" },
  meta: { marginTop: 4, color: colors.muted },
  location: { marginTop: 3, color: colors.dim }
});
