import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";

const badges = ["Century", "Sprinter", "Climber", "Streak", "Explorer"];

export default function ProfileScreen() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? "R3CC Rider";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.cover}>
        <Text style={styles.streak}>{profile?.streak_days ?? 0} day streak</Text>
      </View>
      <View style={styles.identity}>
        <MemberAvatar name={name} size={84} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.handle}>@{profile?.username ?? "r3cc"}</Text>
        <Text style={styles.bio}>{profile?.bio}</Text>
      </View>
      <View style={styles.stats}>
        <Stat label="km" value={`${profile?.total_km ?? 0}`} />
        <Stat label="rides" value={`${profile?.total_rides ?? 0}`} />
        <Stat label="followers" value="214" />
        <Stat label="following" value="76" />
      </View>
      <Text style={styles.section}>Achievements</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
        {badges.map((badge, index) => <View key={badge} style={[styles.badge, index > 2 && styles.locked]}><Text style={styles.badgeText}>{badge}</Text></View>)}
      </ScrollView>
      <View style={styles.actions}>
        <Pressable style={styles.button}><Text style={styles.buttonText}>Edit Profile</Text></Pressable>
        <Link href="/(member)/invite" asChild><Pressable style={styles.buttonAlt}><Text style={styles.buttonText}>Invite Rider</Text></Pressable></Link>
      </View>
      <View style={styles.grid}>{Array.from({ length: 9 }).map((_, index) => <View key={index} style={styles.photo}><Text style={styles.like}>{index + 4}</Text></View>)}</View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  cover: { height: 140, justifyContent: "flex-start", alignItems: "flex-end", padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.primaryDark },
  streak: { color: colors.text, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  identity: { alignItems: "center", gap: spacing.xs, marginTop: -60 },
  name: { color: colors.text, fontSize: 26, fontWeight: "900" },
  handle: { color: colors.muted },
  bio: { color: colors.text, textAlign: "center" },
  stats: { flexDirection: "row", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: colors.text, fontWeight: "900", fontSize: 18 },
  statLabel: { color: colors.muted, fontSize: 12 },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  badges: { gap: spacing.sm },
  badge: { width: 104, height: 74, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  locked: { opacity: 0.35, borderColor: colors.border },
  badgeText: { color: colors.text, fontWeight: "900" },
  actions: { flexDirection: "row", gap: spacing.sm },
  button: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonAlt: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  photo: { width: "32%", aspectRatio: 1, borderRadius: radii.sm, backgroundColor: colors.surface, justifyContent: "flex-end", alignItems: "flex-end", padding: spacing.xs },
  like: { color: colors.text, fontWeight: "900" }
});
