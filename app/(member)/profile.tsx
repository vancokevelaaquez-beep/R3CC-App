import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

const tabs = ["Bikes", "Posts", "Mentioned"] as const;
type ProfileTab = (typeof tabs)[number];

export default function ProfileScreen() {
  const { profile, signOut, changePassword, updateProfile } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ProfileTab>("Bikes");
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

  const stats = useMemo(() => ({
    rides: profile?.total_rides ?? 0,
    distance: profile?.total_km ?? 0,
    time: profile?.weekly_km ?? "0h 00m",
    avg: profile?.streak_days ? `${Math.max(profile.streak_days, 1)}%` : "—"
  }), [profile]);

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile details.");
      setFeedback(null);
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
        <View style={styles.topRow}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <View style={styles.topActions}>
            <Pressable style={styles.actionIcon}><Text style={styles.actionText}>✎</Text></Pressable>
            <Pressable style={styles.actionIcon}><Text style={styles.actionText}>⤴</Text></Pressable>
            <Pressable style={styles.actionIcon}><Text style={styles.actionText}>⚙</Text></Pressable>
          </View>
        </View>

        <View style={styles.avatarGroup}>
          <Pressable onPress={() => uploadProfileImage("avatar")} style={styles.avatarButton}>
            <MemberAvatar name={name} uri={profile?.avatar_url} size={100} />
            <Text style={styles.avatarEdit}>Edit</Text>
          </Pressable>
          <View style={styles.userMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>
            </View>
            <Text style={styles.handle}>@{profile?.username ?? "r3cc"}</Text>
            <Text style={styles.bio}>{profile?.bio ?? "Founder of R3CC. Cycling community, route builder, and ride leader."}</Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipLabel}>RideRank</Text><Text style={styles.chipValue}>+1</Text></View>
          <View style={styles.chip}><Text style={styles.chipLabel}>Followers</Text><Text style={styles.chipValue}>+38</Text></View>
        </View>
      </ImageBackground>

      <View style={styles.metricsRow}>
        <Metric label="Rides" value={`${stats.rides}`} />
        <Metric label="Distance" value={`${stats.distance} km`} />
        <Metric label="Streak" value={`${profile?.streak_days ?? 0}d`} />
        <Metric label="Rating" value={stats.avg} />
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable key={tab} style={[styles.tab, selectedTab === tab && styles.tabActive]} onPress={() => setSelectedTab(tab)}>
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tabContent}>
        <Text style={styles.tabContentTitle}>{selectedTab}</Text>
        <View style={styles.tabCard}>
          <Text style={styles.tabCardText}>This section is a preview of your {selectedTab.toLowerCase()} content.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile details</Text>
        <TextInput value={birthday} onChangeText={setBirthday} placeholder="Birthday (YYYY-MM-DD)" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable style={styles.buttonAlt} onPress={saveProfileDetails} disabled={isSavingProfile}>
          {isSavingProfile ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Save details</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={colors.muted} style={styles.input} secureTextEntry />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={colors.muted} style={styles.input} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {feedback ? <Text style={styles.success}>{feedback}</Text> : null}
        <Pressable style={styles.button} onPress={handlePasswordChange} disabled={isChangingPassword}>
          {isChangingPassword ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Change password</Text>}
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={handleLogout}><Text style={styles.buttonText}>Logout</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  cover: { borderRadius: radii.lg, overflow: "hidden", backgroundColor: colors.surfaceHigh, minHeight: 420, padding: spacing.lg, justifyContent: "space-between" },
  coverImage: { borderRadius: radii.lg, opacity: 0.95 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: colors.text, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "900" },
  topActions: { flexDirection: "row", gap: spacing.sm },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  actionText: { color: colors.text, fontWeight: "900" },
  avatarGroup: { marginTop: spacing.lg, flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  avatarButton: { alignItems: "center" },
  avatarEdit: { marginTop: spacing.sm, color: colors.primary, fontWeight: "900" },
  userMeta: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { color: colors.text, fontSize: 28, fontWeight: "900" },
  verifiedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  verifiedText: { color: colors.text, fontWeight: "900" },
  handle: { color: colors.muted, fontSize: 13 },
  bio: { color: colors.text, marginTop: spacing.sm, lineHeight: 20, maxWidth: "98%" },
  chipRow: { marginTop: spacing.lg, flexDirection: "row", gap: spacing.sm },
  chip: { flex: 1, padding: spacing.sm, borderRadius: radii.lg, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chipLabel: { color: colors.muted, fontSize: 11, textTransform: "uppercase" },
  chipValue: { color: colors.text, fontWeight: "900" },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  metricCard: { flex: 1, minWidth: 120, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: "900" },
  metricLabel: { color: colors.muted, marginTop: spacing.xs, fontSize: 12, textTransform: "uppercase" },
  tabRow: { flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  tab: { flex: 1, padding: spacing.sm, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "800" },
  tabTextActive: { color: colors.background },
  tabContent: { gap: spacing.sm },
  tabContentTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  tabCard: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabCardText: { color: colors.muted },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  input: { minHeight: 48, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh },
  error: { color: colors.warning, fontWeight: "700" },
  success: { color: colors.success, fontWeight: "700" },
  button: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonAlt: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  buttonText: { color: colors.text, fontWeight: "900" },
  actions: { flexDirection: "row", gap: spacing.sm }
});
