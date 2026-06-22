import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ApplicationCard } from "@/components/ApplicationCard";
import { colors, radii, spacing } from "@/constants/theme";
import { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function AdminDashboardScreen() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [paidCount, setPaidCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadCounts() {
      if (!hasSupabaseConfig) {
        setMemberCount(128);
        setPendingCount(7);
        setPaidCount(84);
        return;
      }

      const { count: members } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      const { count: pending } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending");
      const { count: paid } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("membership_paid", true);

      setMemberCount(members ?? 0);
      setPendingCount(pending ?? 0);
      setPaidCount(paid ?? 0);
    }

    loadCounts();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>Admin Panel</Text><Text style={styles.badge}>SHIELD</Text></View>
      <View style={styles.grid}>
        <Stat label="Members" value={memberCount !== null ? String(memberCount) : "…"} />
        <Stat label="Pending" value={pendingCount !== null ? String(pendingCount) : "…"} hot />
        <Stat label="Paid" value={paidCount !== null ? String(paidCount) : "…"} />
        <Stat label="Routes" value="24" />
      </View>
      <Text style={styles.section}>Pending Applications</Text>
      <ApplicationCard name="Lena Torres" handle="lenarides" level="advanced" weeklyKm="180" reason="I want a disciplined group that rides hard and keeps each other honest." referredBy="Ari Santos" />
      <Text style={styles.section}>Recently Decided</Text>
      {['Noah Cruz approved', 'Tala Kim declined', 'Jo Ramos approved'].map((item) => <Text key={item} style={styles.decided}>{item}</Text>)}
    </ScrollView>
  );
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return <View style={[styles.stat, hot && styles.hot]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  badge: { color: colors.primary, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6, overflow: "hidden", fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { width: "48%", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  hot: { borderColor: colors.primary },
  statValue: { color: colors.text, fontSize: 28, fontWeight: "900" },
  statLabel: { color: colors.muted },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  decided: { color: colors.muted, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface }
});
