import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteMap } from "@/components/RouteMap";
import { StatsPanel } from "@/components/StatsPanel";
import { colors, radii, spacing } from "@/constants/theme";
import { formatDuration } from "@/lib/haversine";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useRideStore } from "@/store/rideStore";
import { useAuth } from "@/hooks/useAuth";
import { addDemoRide } from "@/hooks/useFeed";

export default function RideSummaryScreen() {
  const ride = useRideStore();
  const { profile } = useAuth();
  const [caption, setCaption] = useState("#r3cc #cycling");
  const [photos, setPhotos] = useState<ImagePickerAsset[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  async function addPhotos(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", `Allow access to your ${fromCamera ? "camera" : "photo library"} to add ride photos.`);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) setPhotos((current) => [...current, ...result.assets]);
  }

  async function uploadPhotos(userId: string) {
    const urls: string[] = [];
    for (const photo of photos) {
      const response = await fetch(photo.uri);
      const extension = photo.mimeType?.split("/")[1] ?? "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error } = await supabase.storage.from("ride-photos").upload(path, await response.arrayBuffer(), { contentType: photo.mimeType ?? "image/jpeg" });
      if (error) throw error;
      urls.push(supabase.storage.from("ride-photos").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function saveRide(isPublic: boolean) {
    if (isSaving) return;
    setIsSaving(true);
    if (!hasSupabaseConfig) {
      if (isPublic) {
        addDemoRide({
          id: `demo-ride-${Date.now()}`,
          user_id: profile?.id ?? "demo-member",
          title: "R3CC Ride",
          distance_km: ride.distanceKm,
          duration_sec: ride.elapsedSec,
          avg_speed: ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600),
          top_speed: ride.topSpeedKph,
          elevation_m: 0,
          route_coords: ride.coords,
          caption,
          photos: photos.map((photo) => photo.uri),
          created_at: new Date().toISOString(),
          profile: { full_name: profile?.full_name ?? "R3CC Rider", username: profile?.username ?? "r3cc", avatar_url: profile?.avatar_url }
        });
      }
      ride.reset();
      setIsSaving(false);
      router.replace("/(member)/feed");
      return;
    }
    try {
      const sessionResponse = await supabase.auth.getSession();
      const userId = sessionResponse.data?.session?.user?.id;
      if (!userId) throw new Error("Unable to save ride: not signed in.");
      if (profile?.status !== "approved") throw new Error("Your account must be approved before saving rides.");

      const { data: savedRide, error } = await supabase.from("rides").insert({
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
      }).select("id").single();
      if (error || !savedRide) throw error ?? new Error("The ride could not be saved.");

      let photoWarning = "";
      if (photos.length) {
        try {
          const photoUrls = await uploadPhotos(userId);
          if (photoUrls.length) {
            const { error: photoError } = await supabase.from("ride_photos").insert(photoUrls.map((photo_url) => ({ ride_id: savedRide.id, user_id: userId, photo_url })));
            if (photoError) throw photoError;
          }
        } catch (photoError) {
          console.error(photoError);
          photoWarning = " Your ride was shared, but the attached photo could not be uploaded.";
        }
      }

      notifySuccess(`${isPublic ? "Ride shared to feed." : "Ride saved successfully."}${photoWarning}`);
      ride.reset();
      router.replace("/(member)/feed");
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Failed to save ride.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>Ride Complete</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable></View>
      <View style={styles.mapWrap}><RouteMap coords={ride.coords} showMarkers height={300} /></View>
      <Text style={styles.badge}>Personal Record candidate</Text>
      <StatsPanel stats={[{ label: "Distance", value: `${ride.distanceKm.toFixed(2)} km` }, { label: "Moving", value: formatDuration(ride.elapsedSec) }, { label: "Avg", value: `${(ride.distanceKm / Math.max(ride.elapsedSec / 3600, 1 / 3600)).toFixed(1)}` }]} />
      <View style={styles.chart}><Text style={styles.chartText}>Elevation profile</Text></View>
      <TextInput value={caption} onChangeText={setCaption} placeholder="Add a caption" placeholderTextColor={colors.dim} style={styles.input} />
      <View style={styles.photoActions}>
        <Pressable style={styles.photoButton} onPress={() => addPhotos(false)}><Text style={styles.buttonText}>Add Photo</Text></Pressable>
        <Pressable style={styles.photoButton} onPress={() => addPhotos(true)}><Text style={styles.buttonText}>Take Photo</Text></Pressable>
      </View>
      {photos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
        {photos.map((photo, index) => <Pressable key={`${photo.uri}-${index}`} onPress={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
        </Pressable>)}
      </ScrollView> : null}
      <View style={styles.tags}><Text style={styles.tag}>#r3cc</Text><Text style={styles.tag}>#cycling</Text></View>
      <Pressable disabled={isSaving} style={[styles.button, isSaving && styles.buttonDisabled]} onPress={() => saveRide(false)}><Text style={styles.buttonText}>{isSaving ? "Saving..." : "Save Ride"}</Text></Pressable>
      <Pressable disabled={isSaving} style={[styles.buttonAlt, isSaving && styles.buttonDisabled]} onPress={() => saveRide(true)}><Text style={styles.buttonText}>{isSaving ? "Saving..." : "Share to Feed"}</Text></Pressable>
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
  photoActions: { flexDirection: "row", gap: spacing.sm },
  photoButton: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  photoList: { gap: spacing.sm },
  photoPreview: { width: 88, height: 88, borderRadius: radii.sm },
  tags: { flexDirection: "row", gap: spacing.sm },
  tag: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, overflow: "hidden" },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonAlt: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.text, fontWeight: "900" }
});
