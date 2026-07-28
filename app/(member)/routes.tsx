import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { colors, radii, spacing } from "@/constants/theme";
import { routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { RoutePlan } from "@/lib/types";
import { useRideStore } from "@/store/rideStore";

export default function RoutePlanningScreen() {
  const [localRoutes, setLocalRoutes] = useState(fallbackRoutes);
  const [query, setQuery] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(fallbackRoutes[0]?.id ?? null);
  const setNavigationRoute = useRideStore((state) => state.setNavigationRoute);
  const featured = localRoutes.find((route) => route.id === selectedRouteId) ?? localRoutes[0] ?? {
    id: "fallback-route",
    title: "Sample Route",
    description: "Loading route details...",
    distance_km: 0,
    elevation_m: 0,
    difficulty: "easy",
    coords: [],
    is_shared: false
  };
  const filteredRoutes = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return localRoutes;
    return localRoutes.filter((route) => `${route.title} ${route.description}`.toLowerCase().includes(search));
  }, [localRoutes, query]);

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

  function selectRoute(route: RoutePlan) {
    setSelectedRouteId(route.id);
    setQuery(route.title);
  }

  function startNavigation() {
    // Navigation should always open the recorder. A route without coordinates can
    // still be recorded; it simply starts without a route overlay.
    setNavigationRoute(featured.coords ?? []);
    router.navigate("/record");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Routes</Text>
        <Pressable style={styles.savedRidesButton} onPress={() => router.navigate("/(member)/saved-rides")}>
          <Text style={styles.savedRidesText}>Saved Rides</Text>
        </Pressable>
      </View>
      <View style={styles.mapWrap}><RouteMap coords={featured.coords ?? []} dashed height={300} /></View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.stats}>
          <Text style={styles.stat}>{featured.distance_km} km</Text>
          <Text style={styles.stat}>1h 42m</Text>
          <Text style={styles.stat}>{featured.elevation_m} m</Text>
        </View>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search destination or route name" placeholderTextColor={colors.dim} style={styles.search} />
        <Text style={styles.section}>Suggested Routes</Text>
        {[...filteredRoutes].sort((a, b) => Number(b.is_shared) - Number(a.is_shared) || a.distance_km - b.distance_km).map((route) => (
          <Pressable key={route.id} style={[styles.routeRow, route.id === featured.id && styles.routeSelected]} onPress={() => selectRoute(route)}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            <Text style={styles.routeMeta}>{route.distance_km} km | {route.difficulty} | {route.elevation_m} m</Text>
            <Pressable style={[styles.button, route.is_shared ? styles.sharedButton : null]} onPress={(event) => { event.stopPropagation(); toggleShare(route.id, !route.is_shared); }}>
              <Text style={styles.buttonText}>{route.is_shared ? "Shared" : "Share to group"}</Text>
            </Pressable>
          </Pressable>
        ))}
        {!filteredRoutes.length ? <Text style={styles.empty}>No routes match that destination or name.</Text> : null}
        <Pressable style={styles.button} onPress={startNavigation}><Text style={styles.buttonText}>Start Navigation</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  savedRidesButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.surfaceHigh },
  savedRidesText: { color: colors.text, fontWeight: "900", fontSize: 12 },
  mapWrap: { overflow: "hidden", borderRadius: radii.lg },
  sheet: { gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  handle: { alignSelf: "center", width: 46, height: 5, borderRadius: radii.pill, backgroundColor: colors.dim },
  stats: { flexDirection: "row", justifyContent: "space-between" },
  stat: { color: colors.text, fontWeight: "900" },
  search: { color: colors.text, backgroundColor: colors.surfaceHigh, padding: spacing.md, borderRadius: radii.md },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  routeRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  routeSelected: { paddingHorizontal: spacing.sm, marginHorizontal: -spacing.sm, borderRadius: radii.sm, backgroundColor: colors.surfaceHigh },
  routeTitle: { color: colors.text, fontWeight: "900" },
  routeMeta: { color: colors.muted, marginTop: spacing.xs },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary, marginTop: spacing.sm },
  sharedButton: { backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" }
  ,empty: { color: colors.muted, textAlign: "center" }
});
