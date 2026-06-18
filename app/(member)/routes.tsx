import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { colors, radii, spacing } from "@/constants/theme";
import { routes } from "@/lib/mockData";

export default function RoutePlanningScreen() {
  const featured = routes[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Routes</Text>
      <View style={styles.mapWrap}><RouteMap coords={featured.coords} dashed height={300} /></View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.stats}>
          <Text style={styles.stat}>{featured.distance_km} km</Text>
          <Text style={styles.stat}>1h 42m</Text>
          <Text style={styles.stat}>{featured.elevation_m} m</Text>
        </View>
        <Text style={styles.search}>Search destination or route name</Text>
        <Text style={styles.section}>Suggested Routes</Text>
        {routes.sort((a, b) => Number(b.is_shared) - Number(a.is_shared) || a.distance_km - b.distance_km).map((route) => (
          <View key={route.id} style={styles.routeRow}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            <Text style={styles.routeMeta}>{route.distance_km} km | {route.difficulty} | {route.elevation_m} m</Text>
          </View>
        ))}
        <Pressable style={styles.button}><Text style={styles.buttonText}>Start Navigation</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  mapWrap: { overflow: "hidden", borderRadius: radii.lg },
  sheet: { gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  handle: { alignSelf: "center", width: 46, height: 5, borderRadius: radii.pill, backgroundColor: colors.dim },
  stats: { flexDirection: "row", justifyContent: "space-between" },
  stat: { color: colors.text, fontWeight: "900" },
  search: { color: colors.muted, backgroundColor: colors.surfaceHigh, padding: spacing.md, borderRadius: radii.md },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  routeRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  routeTitle: { color: colors.text, fontWeight: "900" },
  routeMeta: { color: colors.muted, marginTop: 3 },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" }
});
