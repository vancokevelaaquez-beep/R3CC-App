import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { StatsPanel } from "@/components/StatsPanel";
import { colors, radii, spacing } from "@/constants/theme";
import { formatDuration } from "@/lib/haversine";
import { useGPS } from "@/hooks/useGPS";
import { useRideStore } from "@/store/rideStore";

export default function RideRecordingScreen() {
  const { permissionGranted } = useGPS();
  const ride = useRideStore();

  useEffect(() => {
    const timer = setInterval(() => ride.tick(), 1000);
    return () => clearInterval(timer);
  }, []);

  function endRide() {
    ride.stop();
    router.replace("/(member)/summary");
  }

  function openMoreOptions() {
    if (!ride.isRecording) {
      router.push("/(member)/profile");
      return;
    }
    Alert.alert("Stop recording?", "Opening another screen will stop and discard the active ride.", [
      { text: "Keep recording", style: "cancel" },
      { text: "Stop recording", style: "destructive", onPress: () => { ride.stop(); router.push("/(member)/profile"); } }
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapContainer}>
        <View style={styles.mapCard}>
          <RouteMap coords={ride.coords.length ? ride.coords : ride.navigationRoute} height={520} />
        </View>
      </View>

      <View style={styles.statsPanelWrap}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Live ride</Text>
          <Text style={styles.sectionMeta}>{ride.coords.length ? "Tracking" : "Ready to start"}</Text>
        </View>
        <View style={styles.speedRow}>
          <View>
            <Text style={styles.speedValue}>{ride.currentSpeedKph.toFixed(1)}</Text>
            <Text style={styles.speedLabel}>kph</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{ride.distanceKm.toFixed(1)} km</Text>
          </View>
        </View>
        <StatsPanel stats={[
          { label: "Avg", value: `${(ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600)).toFixed(1)} km/h` },
          { label: "Top", value: `${ride.topSpeedKph.toFixed(1)} km/h` },
          { label: "Time", value: formatDuration(ride.elapsedSec) }
        ]} />
        {!permissionGranted ? <Text style={styles.warning}>Location permission is needed for live tracking.</Text> : null}
        <View style={styles.controls}>
          {!ride.isRecording ? (
            <Pressable style={[styles.control, styles.start]} onPress={ride.start}><Text style={styles.controlText}>Start ride</Text></Pressable>
          ) : (
            <>
              <Pressable style={[styles.control, styles.secondary]} onPress={ride.isPaused ? ride.resume : ride.pause}><Text style={styles.controlText}>{ride.isPaused ? "Resume" : "Pause"}</Text></Pressable>
              <Pressable style={[styles.control, styles.stop]} onPress={endRide}><Text style={styles.controlText}>Stop</Text></Pressable>
              <Pressable style={[styles.control, styles.secondary]} onPress={openMoreOptions}><Text style={styles.controlText}>More</Text></Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapContainer: { flex: 1, padding: spacing.md },
  mapCard: { flex: 1, borderRadius: radii.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.26, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  statsPanelWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sectionMeta: { color: colors.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  speedRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm },
  speedValue: { color: colors.text, fontSize: 60, fontWeight: "900" },
  speedLabel: { color: colors.muted, fontSize: 14, marginBottom: 6 },
  summaryBlock: { alignItems: "flex-end" },
  summaryLabel: { color: colors.muted, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 18, fontWeight: "900" },
  warning: { color: colors.warning, textAlign: "center" },
  controls: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  control: { flex: 1, minHeight: 52, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceHigh },
  start: { backgroundColor: colors.primary },
  stop: { backgroundColor: colors.primaryDark },
  secondary: { backgroundColor: colors.surface },
  controlText: { color: colors.text, fontWeight: "900", textTransform: "uppercase", fontSize: 13 }
});