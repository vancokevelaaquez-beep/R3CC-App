import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { profile, signOut, changePassword, updateProfile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const name = profile?.full_name ?? "R3CC Rider";

  useEffect(() => {
    setBirthday(profile?.birthday ?? "");
    setLocation(profile?.location ?? "");
  }, [profile?.birthday, profile?.location]);

  async function uploadProfileImage(kind: "avatar" | "cover") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to update your profile image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: kind === "avatar" ? [1, 1] : [16, 7] });
    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      let imageUrl = asset.uri;
      if (hasSupabaseConfig) {
        const response = await fetch(asset.uri);
        const extension = asset.mimeType?.split("/")[1] ?? "jpg";
        const path = `${profile?.id}/${kind}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, await response.arrayBuffer(), { contentType: asset.mimeType ?? "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
      }
      await updateProfile(kind === "avatar" ? { avatar_url: imageUrl } : { cover_url: imageUrl });
    } catch (err) {
      Alert.alert("Unable to upload image", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function saveProfileDetails() {
    setIsSavingProfile(true);
    try {
      await updateProfile({ birthday: birthday || null, location: location.trim() || null });
      setFeedback("Profile details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out right now.");
    }
  }

  async function handlePasswordChange() {
    setError(null);
    setFeedback(null);

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(newPassword);
      setFeedback("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change your password right now.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ImageBackground source={profile?.cover_url ? { uri: profile.cover_url } : undefined} style={styles.cover} imageStyle={styles.coverImage}>
        <Pressable style={styles.coverEdit} onPress={() => uploadProfileImage("cover")}><Text style={styles.coverEditText}>Change cover</Text></Pressable>
        <Text style={styles.streak}>{profile?.streak_days ?? 0} day streak</Text>
      </ImageBackground>
      <View style={styles.identity}>
        <Pressable onPress={() => uploadProfileImage("avatar")} style={styles.avatarButton}>
          <MemberAvatar name={name} uri={profile?.avatar_url} size={84} />
          <Text style={styles.avatarEdit}>Edit photo</Text>
        </Pressable>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.handle}>@{profile?.username ?? "r3cc"}</Text>
        <Text style={styles.bio}>{profile?.bio}</Text>
      </View>
      <View style={styles.stats}>
        <Stat label="km" value={`${profile?.total_km ?? 0}`} />
        <Stat label="rides" value={`${profile?.total_rides ?? 0}`} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile details</Text>
        <TextInput value={birthday} onChangeText={setBirthday} placeholder="Birthday (YYYY-MM-DD)" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable style={styles.buttonAlt} onPress={saveProfileDetails} disabled={isSavingProfile}>
          {isSavingProfile ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Save Profile Details</Text>}
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {feedback ? <Text style={styles.success}>{feedback}</Text> : null}
        <Pressable style={styles.button} onPress={handlePasswordChange} disabled={isChangingPassword}>
          {isChangingPassword ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Change Password</Text>}
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={handleLogout}><Text style={styles.buttonText}>Logout</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  cover: { height: 140, justifyContent: "space-between", alignItems: "flex-end", padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.primaryDark, overflow: "hidden" },
  coverImage: { borderRadius: radii.lg },
  coverEdit: { alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  coverEditText: { color: colors.text, fontWeight: "800", fontSize: 12 },
  streak: { color: colors.text, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  identity: { alignItems: "center", gap: spacing.xs, marginTop: -60 },
  avatarButton: { alignItems: "center", gap: 4 },
  avatarEdit: { color: colors.text, fontSize: 12, fontWeight: "800", backgroundColor: colors.surfaceHigh, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, overflow: "hidden" },
  name: { color: colors.text, fontSize: 26, fontWeight: "900" },
  handle: { color: colors.muted },
  bio: { color: colors.text, textAlign: "center" },
  stats: { flexDirection: "row", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: colors.text, fontWeight: "900", fontSize: 18 },
  statLabel: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: "row", gap: spacing.sm },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  input: { minHeight: 48, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh },
  error: { color: colors.warning, fontWeight: "700" },
  success: { color: colors.success, fontWeight: "700" },
  button: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonAlt: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" }
});
