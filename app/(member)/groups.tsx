import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { GroupRideCard } from "@/components/GroupRideCard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { groupRides } from "@/lib/mockData";

export default function GroupsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Groups</Text>
      <View style={styles.featured}>
        <Text style={styles.badge}>Featured</Text>
        <Text style={styles.club}>R3CC Official Club</Text>
        <Text style={styles.meta}>128 members riding under one private banner</Text>
        <Pressable style={styles.button}><Text style={styles.buttonText}>Joined</Text></Pressable>
      </View>
      <Text style={styles.section}>Active Members</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatars}>
        {["Ari Santos", "Mika Reyes", "Jules Tan", "Noah Cruz"].map((name) => <MemberAvatar key={name} name={name} size={52} />)}
      </ScrollView>
      <Text style={styles.section}>Upcoming Group Rides</Text>
      {groupRides.map((ride) => <GroupRideCard key={ride.id} ride={ride} />)}
      <Text style={styles.section}>Past Rides</Text>
      <GroupRideCard ride={{ ...groupRides[0], id: "past", title: "Night Signal", scheduled_at: new Date(Date.now() - 86400000).toISOString(), rsvp_count: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  featured: { minHeight: 180, gap: spacing.sm, justifyContent: "flex-end", padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  badge: { alignSelf: "flex-start", color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  club: { color: colors.text, fontSize: 24, fontWeight: "900" },
  meta: { color: colors.muted },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  avatars: { gap: spacing.sm }
});
