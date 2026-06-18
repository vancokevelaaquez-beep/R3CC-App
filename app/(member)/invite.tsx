import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { InviteQuotaBar } from "@/components/InviteQuotaBar";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function InviteRiderScreen() {
  const { profile } = useAuth();
  const [target, setTarget] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function sendInvite() {
    if (!target.trim()) {
      setStatusMessage("Enter a phone number or email address.");
      return;
    }

    const code = profile?.invite_code ?? `R3CC-${profile?.username?.slice(0, 3).toUpperCase() ?? "MEM"}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    if (hasSupabaseConfig && profile?.id) {
      await supabase.from("invites").insert({ code, created_by: profile.id, used_by: null, created_at: new Date().toISOString() });
    }

    setStatusMessage(`Invite sent to ${target}`);
    setTarget("");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>Invite a Rider</Text><Text style={styles.pill}>Member</Text></View>
      <InviteQuotaBar used={profile?.invites_used ?? 2} quota={profile?.invite_quota ?? 5} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send invite</Text>
        <TextInput value={target} onChangeText={setTarget} placeholder="Phone or email" placeholderTextColor={colors.dim} style={styles.input} />
        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        <Pressable style={styles.button} onPress={sendInvite}><Text style={styles.buttonText}>Send</Text></Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal code</Text>
        <Text style={styles.code}>{profile?.invite_code ?? "R3CC-AJ-7X"}</Text>
        <Text style={styles.note}>Code auto-approves. Use wisely.</Text>
      </View>
      <Text style={styles.section}>Past invites</Text>
      {["Cam Lee", "Ira Gomez"].map((name, index) => (
        <View key={name} style={styles.row}><MemberAvatar name={name} /><View style={styles.rowCopy}><Text style={styles.rowName}>{name}</Text><Text style={styles.rowMeta}>{index === 0 ? "Member" : "Pending"}</Text></View></View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  pill: { color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: radii.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceHigh, color: colors.text },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.sm, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" },
  code: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  note: { color: colors.muted },
  status: { color: colors.primary, marginTop: spacing.xs },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  rowCopy: { flex: 1 },
  rowName: { color: colors.text, fontWeight: "900" },
  rowMeta: { color: colors.muted }
});
