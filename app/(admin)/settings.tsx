import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSettingsScreen() {
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/admin-login");
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Setting label="Public teaser" value="On" />
      <Field label="Invite quota per member" value="5" />
      <Field label="Max members cap" value="250" />
      <Setting label="Application Instagram field" value="On" />
      <Setting label="Application Strava field" value="Off" />
      <Pressable style={styles.button}><Text style={styles.buttonText}>Export Members CSV</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.label}>Broadcast</Text>
        <TextInput placeholder="Message to all members" placeholderTextColor={colors.dim} style={styles.textarea} multiline />
        <Pressable style={styles.button}><Text style={styles.buttonText}>Send Push Notification</Text></Pressable>
      </View>
      <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <View style={styles.card}><Text style={styles.label}>{label}</Text><TextInput defaultValue={value} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rowLabel: { color: colors.text, fontWeight: "800" },
  value: { color: colors.primary, fontWeight: "900" },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh },
  textarea: { minHeight: 110, borderRadius: radii.sm, padding: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh, textAlignVertical: "top" },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  logoutButton: { backgroundColor: colors.primary, marginTop: spacing.lg },
  buttonText: { color: colors.text, fontWeight: "900" }
});
