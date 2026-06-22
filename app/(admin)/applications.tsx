import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ApplicationCard } from "@/components/ApplicationCard";
import { colors, radii, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Applicant = {
  id: string;
  user_id: string;
  full_name: string;
  riding_level: string | null;
  weekly_km: string | null;
  reason: string | null;
  referred_by?: string | null;
  status: string;
};

export default function AdminApplicationsScreen() {
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setError("");
    if (!hasSupabaseConfig) {
      setApplications([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id,user_id,full_name,riding_level,weekly_km,reason,referred_by,status")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load applications:", error);
        setError("Unable to load applications.");
        return;
      }

      setApplications(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function decide(id: string, status: "approved" | "declined") {
    setError("");
    if (!hasSupabaseConfig) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id)
        .select("user_id")
        .single();

      if (error) {
        console.error("Failed to update application:", error);
        setError("Unable to update application status.");
        return;
      }

      const userId = data?.user_id;
      if (userId) {
        const profileUpdate = await supabase.from("profiles").update({ status }).eq("id", userId);
        if (profileUpdate.error) {
          console.error("Failed to update profile status:", profileUpdate.error);
          setError("Application updated, but profile status could not be changed.");
        }

        await supabase.from("notifications").insert({
          user_id: userId,
          type: status === "approved" ? "approved" : "declined",
          message: `Your application has been ${status}.`,
          data: {},
          is_read: false
        });
      }

      setApplications((current) => current.filter((application) => application.id !== id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Applicants</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.status}>Loading applicants…</Text> : null}
      {!loading && applications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pending applicants at the moment.</Text>
        </View>
      ) : null}
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          name={application.full_name}
          handle={application.referred_by ?? "pending"}
          level={application.riding_level ?? "unknown"}
          weeklyKm={application.weekly_km ?? "0"}
          reason={application.reason ?? "No reason provided."}
          referredBy={application.referred_by ?? undefined}
          onApprove={() => decide(application.id, "approved")}
          onDecline={() => decide(application.id, "declined")}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  error: { color: colors.primary },
  status: { color: colors.muted },
  emptyState: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.muted, textAlign: "center" }
});
