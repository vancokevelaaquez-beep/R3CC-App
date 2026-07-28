import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { colors, radii, spacing } from "@/constants/theme";
import { getDemoSavedRides } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { formatDuration } from "@/lib/haversine";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride } from "@/lib/types";

export default function SavedRidesScreen() {
  const { profile } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRides = useCallback(async () => {
    setLoading(true);
    if (!hasSupabaseConfig) {
      setRides(getDemoSavedRides(profile?.id ?? "demo-member"));
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRides([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("rides")
      .select("*, ride_photos(photo_url)")
      .eq("user_id", user.id)
      .eq("is_public", false)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setRides((data as (Ride & { ride_photos?: { photo_url: string }[] })[]).map(({ ride_photos, ...ride }) => ({
        ...ride,
        photos: ride_photos?.map((photo) => photo.photo_url) ?? []
      })));
    }
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { loadRides(); }, [loadRides]));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Saved Rides</Text>
      <Text style={styles.subtitle}>Your private ride history</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && !rides.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No saved rides yet</Text><Text style={styles.emptyCopy}>Save a completed ride and it will appear here.</Text></View> : null}
      {rides.map((ride) => <View key={ride.id} style={styles.rideCard}>
        <View style={styles.rideHeader}><View><Text style={styles.rideTitle}>{ride.title}</Text><Text style={styles.date}>{new Date(ride.created_at).toLocaleDateString()}</Text></View><Text style={styles.distance}>{ride.distance_km.toFixed(2)} km</Text></View>
        {ride.route_coords?.length ? <View style={styles.mapWrap}><RouteMap coords={ride.route_coords} height={150} /></View> : null}
        <View style={styles.stats}><Text style={styles.stat}>{formatDuration(ride.duration_sec)}</Text><Text style={styles.stat}>{ride.avg_speed.toFixed(1)} km/h avg</Text><Text style={styles.stat}>{ride.elevation_m} m</Text></View>
        {ride.caption ? <Text style={styles.caption}>{ride.caption}</Text> : null}
      </View>)}
      <Pressable onPress={loadRides} style={styles.refresh}><Text style={styles.refreshText}>Refresh list</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: -spacing.sm },
  rideCard: { gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg },
  rideHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rideTitle: { color: colors.text, fontWeight: "900", fontSize: 17 },
  date: { color: colors.muted, marginTop: 3 },
  distance: { color: colors.primary, fontWeight: "900", fontSize: 17 },
  mapWrap: { overflow: "hidden", borderRadius: radii.md },
  stats: { flexDirection: "row", justifyContent: "space-between" },
  stat: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  caption: { color: colors.text },
  empty: { alignItems: "center", gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radii.lg },
  emptyTitle: { color: colors.text, fontWeight: "900", fontSize: 18 },
  emptyCopy: { color: colors.muted, textAlign: "center" },
  refresh: { alignSelf: "center", padding: spacing.sm },
  refreshText: { color: colors.primary, fontWeight: "800" }
});
