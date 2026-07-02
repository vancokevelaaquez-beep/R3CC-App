import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { StatsPanel } from "@/components/StatsPanel";
import { colors, radii, spacing } from "@/constants/theme";
import { formatDuration } from "@/lib/haversine";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useRideStore } from "@/store/rideStore";
import { useAuth } from "@/hooks/useAuth";

export default function RideSummaryScreen() {
  const ride = useRideStore();
  const { profile } = useAuth();
  const [caption, setCaption] = useState("#r3cc #cycling");

  async function saveRide(isPublic: boolean) {
    if (!hasSupabaseConfig) {
      ride.reset();
      router.replace("/(member)/feed");
      return;
    }

    const sessionResponse = await supabase.auth.getSession();
    const userId = sessionResponse.data?.session?.user?.id;
    if (!userId) {
      notifyError("Unable to save ride: not signed in.");
      return;
    }

    if (!profile?.status || profile.status !== "approved") {
      notifyError("Your account must be approved before saving rides.");
      return;
    }

    const { error } = await supabase.from("rides").insert({
      user_id: userId,
      title: "R3CC Ride",
      distance_km: ride.distanceKm,
      duration_sec: ride.elapsedSec,
      avg_speed: ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600),
      top_speed: ride.topSpeedKph,
      elevation_m: 0,
      route_coords: ride.coords,
      is_public: isPublic,
      caption
    });

    if (error) {
      notifyError(error.message || "Failed to save ride.");
      console.error(error);
      return;
    }

    notifySuccess(isPublic ? "Ride shared to feed." : "Ride saved successfully.");
    ride.reset();
    router.replace("/(member)/feed");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>Ride Complete</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable></View>
      <View style={styles.mapWrap}><RouteMap coords={ride.coords} showMarkers height={300} /></View>
      <Text style={styles.badge}>Personal Record candidate</Text>
      <StatsPanel stats={[{ label: "Distance", value: `${ride.distanceKm.toFixed(2)} km` }, { label: "Moving", value: formatDuration(ride.elapsedSec) }, { label: "Avg", value: `${(ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600)).toFixed(1)}` }]} />
      <View style={styles.chart}><Text style={styles.chartText}>Elevation profile</Text></View>
      <TextInput value={caption} onChangeText={setCaption} placeholder="Add a caption" placeholderTextColor={colors.dim} style={styles.input} />
      <View style={styles.tags}><Text style={styles.tag}>#r3cc</Text><Text style={styles.tag}>#cycling</Text></View>
      <Pressable style={styles.button} onPress={() => saveRide(false)}><Text style={styles.buttonText}>Save Ride</Text></Pressable>
      <Pressable style={styles.buttonAlt} onPress={() => saveRide(true)}><Text style={styles.buttonText}>Share to Feed</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  back: { color: colors.muted, fontWeight: "900" },
  mapWrap: { overflow: "hidden", borderRadius: radii.lg },
  badge: { alignSelf: "flex-start", color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  chart: { height: 100, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chartText: { color: colors.muted },
  input: { minHeight: 90, borderRadius: radii.md, padding: spacing.md, color: colors.text, backgroundColor: colors.surface, textAlignVertical: "top" },
  tags: { flexDirection: "row", gap: spacing.sm },
  tag: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, overflow: "hidden" },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonAlt: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" }
});
