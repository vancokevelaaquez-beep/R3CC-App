import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RideCard } from "@/components/RideCard";
import { colors, radii, spacing } from "@/constants/theme";
import { useFeed } from "@/hooks/useFeed";

function SharedRouteCard({ route }: { route: { id: string; title: string; distance_km: number; difficulty: string; elevation_m: number; is_shared: boolean } }) {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        {route.is_shared ? <Text style={styles.sharedPill}>Shared</Text> : null}
      </View>
      <Text style={styles.routeMeta}>{route.distance_km} km · {route.difficulty} · {route.elevation_m} m</Text>
    </View>
  );
}

export default function HomeFeedScreen() {
  const { rides, sharedRoutes } = useFeed();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
          <View style={styles.headerActions}>
            <Link href="/(member)/notifications" asChild><Pressable style={styles.icon}><Text style={styles.iconText}>B</Text></Pressable></Link>
            <Pressable style={styles.icon}><Text style={styles.iconText}>S</Text></Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {["Official", "Climbers", "Sprinters", "Cafe"].map((story) => <View key={story} style={styles.story}><Text style={styles.storyText}>{story}</Text></View>)}
        </ScrollView>
        {sharedRoutes.length ? (
          <View>
            <Text style={styles.section}>Shared routes</Text>
            {sharedRoutes.map((route) => <SharedRouteCard key={route.id} route={route} />)}
          </View>
        ) : null}
        {rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
      </ScrollView>
      <Link href="/(member)/record" asChild><Pressable style={styles.fab}><Text style={styles.fabText}>BIKE</Text></Pressable></Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  iconText: { color: colors.text, fontWeight: "900" },
  stories: { gap: spacing.sm },
  story: { width: 92, height: 92, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  storyText: { color: colors.text, fontWeight: "800" },
  section: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: spacing.lg, marginBottom: spacing.sm },
  routeCard: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeTitle: { color: colors.text, fontWeight: "900" },
  sharedPill: { color: colors.primary, fontWeight: "900" },
  routeMeta: { color: colors.muted, marginTop: spacing.xs },
  fab: { position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  fabText: { color: colors.text, fontWeight: "900", fontSize: 12 }
});
