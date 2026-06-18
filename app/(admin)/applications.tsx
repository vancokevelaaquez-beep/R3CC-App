import { ScrollView, StyleSheet, Text } from "react-native";
import { ApplicationCard } from "@/components/ApplicationCard";
import { colors, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

const applicants = [
  { id: "1", name: "Lena Torres", handle: "lenarides", level: "advanced", weeklyKm: "180", reason: "I want a disciplined group that rides hard and keeps each other honest.", referredBy: "Ari Santos" },
  { id: "2", name: "Marco Lim", handle: "marcospins", level: "intermediate", weeklyKm: "120", reason: "Looking for safer routes and stronger weekend rides.", referredBy: "R3CC-AJ-7X" }
];

export default function AdminApplicationsScreen() {
  async function decide(id: string, status: "approved" | "declined") {
    if (hasSupabaseConfig) {
      const { data } = await supabase.from("applications").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id).select("user_id").single();
      if (data?.user_id) {
        await supabase.from("profiles").update({ status }).eq("id", data.user_id);
        await supabase.from("notifications").insert({ user_id: data.user_id, type: status === "approved" ? "approved" : "approved", message: `Application ${status}`, is_read: false });
      }
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Applicants</Text>
      {applicants.map((applicant) => <ApplicationCard key={applicant.id} {...applicant} onApprove={() => decide(applicant.id, "approved")} onDecline={() => decide(applicant.id, "declined")} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" }
});
