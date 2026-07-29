import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type LandingStats = {
  memberCount: number;
  monthlyKm: number;
  weeklyRides: number;
};

const fallbackStats: LandingStats = {
  memberCount: 128,
  monthlyKm: 42150,
  weeklyRides: 86,
};

function formatCompactDistance(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
}

export default function PublicLandingScreen() {
  const [stats, setStats] = useState<LandingStats>(fallbackStats);

  useEffect(() => {
    let isActive = true;

    async function loadStats() {
      if (!hasSupabaseConfig) {
        if (isActive) {
          setStats(fallbackStats);
        }
        return;
      }

      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: memberCount }, { data: ridesData, error: ridesError }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "member").eq("status", "approved"),
          supabase.from("rides").select("distance_km, created_at").gte("created_at", startOfMonth),
        ]);

        if (!isActive) {
          return;
        }

        if (ridesError) {
          throw ridesError;
        }

        const monthlyKm = (ridesData ?? []).reduce((sum, ride) => {
          const distance = Number(ride.distance_km ?? 0);
          return sum + (Number.isFinite(distance) ? distance : 0);
        }, 0);

        const weeklyRides = (ridesData ?? []).filter((ride) => {
          return ride.created_at ? ride.created_at >= startOfWeek : false;
        }).length;

        setStats({
          memberCount: memberCount ?? 0,
          monthlyKm,
          weeklyRides,
        });
      } catch (error) {
        console.warn("Failed to load landing stats", error);
        if (isActive) {
          setStats(fallbackStats);
        }
      }
    }

    loadStats();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Text style={styles.logo}>R3CC</Text>
        <Text style={styles.pill}>Private Group</Text>
      </View>
      <Text style={styles.headline}>Members Only.</Text>
      <Text style={styles.tagline}>Ride. Record. Connect. Conquer.</Text>

      <View style={styles.photoCard}>
        <View style={styles.photoFrame}>
          <Text style={styles.photoBadge}>Group Photo</Text>
          <Text style={styles.photoHint}>Drop your team image here</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>{stats.memberCount} Members</Text>
        <Text style={styles.stat}>{formatCompactDistance(stats.monthlyKm)}k Monthly KM</Text>
        <Text style={styles.stat}>{stats.weeklyRides} Rides/week</Text>
      </View>
      <Link href="/apply" asChild>
        <Pressable style={styles.cta}><Text style={styles.ctaText}>Apply to Join R3CC</Text></Pressable>
      </Link>
      <Link href="/login" asChild><Text style={styles.smallLink}>Member sign in</Text></Link>
      <Link href="/admin-login" asChild><Text style={styles.smallLink}>Admin access</Text></Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, minHeight: "100%" },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  pill: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, overflow: "hidden" },
  headline: { color: colors.text, fontSize: typography.title, fontWeight: "900", textAlign: "center" },
  tagline: { color: colors.muted, textAlign: "center", fontSize: 16 },
  photoCard: { alignItems: "center", marginTop: spacing.xs },
  photoFrame: { width: "100%", minHeight: 220, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, borderStyle: "dashed", justifyContent: "center", alignItems: "center", padding: spacing.xl },
  photoBadge: { color: colors.primary, fontWeight: "900", fontSize: 16, marginBottom: spacing.xs },
  photoHint: { color: colors.muted, textAlign: "center" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  stat: { color: colors.text, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.pill, overflow: "hidden", fontWeight: "800" },
  cta: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  ctaText: { color: colors.text, fontWeight: "900", fontSize: 16 },
  smallLink: { color: colors.muted, textAlign: "center" },
});
