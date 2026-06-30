import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { colors, radii, spacing } from "@/constants/theme";
import { routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function RoutePlanningScreen() {
  const [localRoutes, setLocalRoutes] = useState(fallbackRoutes);
  const featured = localRoutes[0];

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    async function loadRoutes() {
      const { data } = await supabase.from("routes").select("*");
      if (data) {
        setLocalRoutes(data);
      }
    }

    loadRoutes();
  }, []);

  async function toggleShare(routeId: string, share: boolean) {
    setLocalRoutes((current) => current.map((route) => route.id === routeId ? { ...route, is_shared: share } : route));

    if (!hasSupabaseConfig) {
      return;
    }

    const { error } = await supabase.from("routes").update({ is_shared: share }).eq("id", routeId);
    if (error) {
      console.error("Failed to update shared state:", error);
      setLocalRoutes((current) => current.map((route) => route.id === routeId ? { ...route, is_shared: !share } : route));
    }
  }

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
        {[...localRoutes].sort((a, b) => Number(b.is_shared) - Number(a.is_shared) || a.distance_km - b.distance_km).map((route) => (
          <View key={route.id} style={styles.routeRow}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            <Text style={styles.routeMeta}>{route.distance_km} km | {route.difficulty} | {route.elevation_m} m</Text>
            <Pressable style={[styles.button, route.is_shared ? styles.sharedButton : null]} onPress={() => toggleShare(route.id, !route.is_shared)}>
              <Text style={styles.buttonText}>{route.is_shared ? "Shared" : "Share to group"}</Text>
            </Pressable>
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
  routeRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  routeTitle: { color: colors.text, fontWeight: "900" },
  routeMeta: { color: colors.muted, marginTop: spacing.xs },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary, marginTop: spacing.sm },
  sharedButton: { backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" }
});
