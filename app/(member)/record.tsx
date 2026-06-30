import * as ImagePicker from "expo-image-picker";
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
    ride.start();
    const timer = setInterval(() => ride.tick(), 1000);
    return () => clearInterval(timer);
  }, []);

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      ride.addPhoto(result.assets[0].uri);
    }
  }

  function stop() {
    Alert.alert("Stop ride?", "Your ride will be saved to the summary screen.", [
      { text: "Cancel", style: "cancel" },
      { text: "Stop", style: "destructive", onPress: () => { ride.stop(); router.replace("/(member)/summary"); } }
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapLayer}><RouteMap coords={ride.coords} height={520} /></View>
      <View style={styles.topHud}>
        <Text style={styles.rec}>REC</Text>
        <Text style={styles.timer}>{formatDuration(ride.elapsedSec)}</Text>
      </View>
      <View style={styles.bottomPanel}>
        <Text style={styles.speed}>{ride.currentSpeedKph.toFixed(1)}</Text>
        <Text style={styles.speedLabel}>kph</Text>
        <StatsPanel stats={[{ label: "Distance", value: `${ride.distanceKm.toFixed(2)} km` }, { label: "Avg", value: `${(ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600)).toFixed(1)}` }, { label: "Top", value: `${ride.topSpeedKph.toFixed(1)}` }]} />
        {!permissionGranted ? <Text style={styles.warning}>Location permission is needed for live tracking.</Text> : null}
        <View style={styles.controls}>
          <Pressable style={styles.control}><Text style={styles.controlText}>Center</Text></Pressable>
          <Pressable style={styles.control} onPress={ride.isPaused ? ride.resume : ride.pause}><Text style={styles.controlText}>{ride.isPaused ? "Resume" : "Pause"}</Text></Pressable>
          <Pressable style={[styles.control, styles.stop]} onPress={stop}><Text style={styles.controlText}>Stop</Text></Pressable>
          <Pressable style={styles.control} onPress={addPhoto}><Text style={styles.controlText}>Photo</Text></Pressable>
          <Pressable style={styles.control} onPress={() => router.push("/(member)/profile")}><Text style={styles.controlText}>More</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapLayer: { flex: 1, backgroundColor: colors.surfaceHigh },
  topHud: { position: "absolute", top: 54, left: spacing.lg, right: spacing.lg, flexDirection: "row", justifyContent: "space-between" },
  rec: { color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  timer: { color: colors.text, fontSize: 18, fontWeight: "900", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, overflow: "hidden" },
  bottomPanel: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.lg, gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: "rgba(22,22,22,0.9)", borderWidth: 1, borderColor: colors.border },
  speed: { color: colors.text, fontSize: 72, lineHeight: 78, fontWeight: "900", textAlign: "center" },
  speedLabel: { color: colors.muted, textAlign: "center", marginTop: -16 },
  warning: { color: colors.warning, textAlign: "center" },
  controls: { flexDirection: "row", gap: spacing.xs },
  control: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.surfaceHigh },
  stop: { backgroundColor: colors.primary },
  controlText: { color: colors.text, fontWeight: "900", fontSize: 12 }
});
