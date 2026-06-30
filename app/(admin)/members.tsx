import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";

const demoMembers = [
  { id: "demo-1", full_name: "Ari Santos", email: "ari@r3cc.app", role: "member", status: "approved", total_km: 1200, membership_paid: false },
  { id: "demo-2", full_name: "Mika Reyes", email: "mika@r3cc.app", role: "member", status: "approved", total_km: 890, membership_paid: true },
  { id: "demo-3", full_name: "Jules Tan", email: "jules@r3cc.app", role: "member", status: "approved", total_km: 640, membership_paid: false }
];

export default function AdminMembersScreen() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Partial<Profile>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!hasSupabaseConfig) {
        setMembers(demoMembers as Partial<Profile>[]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, role, status, total_km, membership_paid, membership_paid_at");
      setLoading(false);
      if (error) {
        console.error("Failed to load members:", error);
        setMembers(demoMembers as Partial<Profile>[]);
        return;
      }
      setMembers(data ?? []);
    }

    load();
  }, []);

  async function togglePaid(id: string, current: boolean | null | undefined) {
    if (!hasSupabaseConfig) {
      setMembers((m) => m.map((x) => (x.id === id ? { ...x, membership_paid: !current } : x)));
      return;
    }

    const next = !current;
    // optimistic update
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, membership_paid: next } : x)));
    const { error } = await supabase.from("profiles").update({ membership_paid: next, membership_paid_at: next ? new Date().toISOString() : null }).eq("id", id);
    if (error) {
      console.error("Failed to update membership_paid:", error);
      // revert
      setMembers((m) => m.map((x) => (x.id === id ? { ...x, membership_paid: current } : x)));
    }
  }

  const filtered = members.filter((m) => (query ? m.full_name?.toLowerCase().includes(query.toLowerCase()) || m.email?.toLowerCase().includes(query.toLowerCase()) : true));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Members</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search members" placeholderTextColor={colors.dim} style={styles.input} />
      <View style={styles.filters}>{["All", "Active", "Inactive", "Admins"].map((filter) => <Text key={filter} style={styles.filter}>{filter}</Text>)}</View>

      {loading ? <Text style={{ color: colors.muted }}>Loading members…</Text> : null}

      {filtered.map((member) => (
        <View key={member.id} style={styles.row}>
          <MemberAvatar name={member.full_name ?? member.email ?? "Member"} />
          <View style={styles.copy}>
            <Text style={styles.name}>{member.full_name ?? member.email}</Text>
            <Text style={styles.meta}>{(member.total_km as number | undefined) ?? 0} km</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.status, member.role === "admin" ? { color: colors.primary } : null]}>{member.role === "admin" ? "Admin" : member.status}</Text>
            <Pressable style={[styles.paidButton, member.membership_paid ? styles.paid : null]} onPress={() => member.id && togglePaid(member.id, Boolean(member.membership_paid))}>
              <Text style={styles.paidText}>{member.membership_paid ? "Paid" : "Mark Paid"}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filters: { flexDirection: "row", gap: spacing.sm },
  filter: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  copy: { flex: 1 },
  name: { color: colors.text, fontWeight: "900" },
  meta: { color: colors.muted, marginTop: 3 },
  status: { color: colors.primary, fontWeight: "900" },
  paidButton: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.surfaceHigh },
  paid: { backgroundColor: colors.primary },
  paidText: { color: colors.text, fontWeight: "800" }
});


