import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { GroupRideCard } from "@/components/GroupRideCard";
import { colors, radii, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { GroupRide, Profile } from "@/lib/types";
import { groupRides as fallbackGroupRides } from "@/lib/mockData";

type AdminGroupRide = GroupRide & { rsvp_count?: number };

export default function AdminRideFeedScreen() {
  const [rides, setRides] = useState<AdminGroupRide[]>([]);
  const [members, setMembers] = useState<Pick<Profile, "id" | "full_name" | "email" | "role" | "status">[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    distance_km: "",
    meet_location: "",
    max_riders: "",
    selectedMemberIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!hasSupabaseConfig) {
      setRides(fallbackGroupRides.map((ride) => ({ ...ride, rsvp_count: ride.rsvp_count ?? 0 })));
      return;
    }

    setLoading(true);
    try {
      const [{ data: ridesData, error: ridesError }, { data: membersData, error: membersError }] = await Promise.all([
        supabase.from("group_rides").select("id,title,description,scheduled_at,distance_km,elevation_m,meet_location,max_riders,created_at,group_ride_members(id)").order("scheduled_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name,email,role,status").in("role", ["member"]).eq("status", "approved")
      ]);

      if (ridesError) {
        console.error("Failed to load group rides:", ridesError);
      } else if (ridesData) {
        setRides(
          ridesData.map((ride: any) => ({
            ...ride,
            rsvp_count: ride.group_ride_members?.length ?? 0
          }))
        );
      }

      if (membersError) {
        console.error("Failed to load members:", membersError);
      } else if (membersData) {
        setMembers(membersData);
      }
    } finally {
      setLoading(false);
    }
  }

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const toggleMember = (id: string) => {
    setForm((current) => ({
      ...current,
      selectedMemberIds: current.selectedMemberIds.includes(id)
        ? current.selectedMemberIds.filter((memberId) => memberId !== id)
        : [...current.selectedMemberIds, id]
    }));
  };

  async function createRide() {
    if (!form.title || !form.scheduled_at || !form.meet_location) {
      notifyError("Title, scheduled date, and location are required.");
      return;
    }

    setSaving(true);
    try {
      const sessionResponse = await supabase.auth.getSession();
      const userId = sessionResponse.data?.session?.user?.id;
      if (!userId) {
        throw new Error("Admin session is required to create rides.");
      }

      const distance = Number(form.distance_km) || 0;
      const maxRiders = form.max_riders ? Number(form.max_riders) : null;
      const scheduledAt = new Date(form.scheduled_at).toISOString();

      const { data: rideData, error: createError } = await supabase
        .from("group_rides")
        .insert([
          {
            title: form.title,
            description: form.description,
            scheduled_at: scheduledAt,
            distance_km: distance,
            elevation_m: 0,
            meet_location: form.meet_location,
            max_riders: maxRiders,
            created_by: userId
          }
        ])
        .select()
        .single();

      if (createError || !rideData) {
        throw createError ?? new Error("Failed to create ride.");
      }

      if (form.selectedMemberIds.length) {
        const membersRows = form.selectedMemberIds.map((memberId) => ({
          ride_id: rideData.id,
          user_id: memberId,
          status: "going"
        }));
        const { error: memberError } = await supabase.from("group_ride_members").insert(membersRows);
        if (memberError) {
          throw memberError;
        }
      }

      setRides((current) => [{ ...rideData, rsvp_count: form.selectedMemberIds.length }, ...current]);
      setForm({ title: "", description: "", scheduled_at: "", distance_km: "", meet_location: "", max_riders: "", selectedMemberIds: [] });
      setFormVisible(false);
      notifySuccess("Official ride created successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create ride.";
      notifyError(message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Official Rides</Text>
        <Pressable style={styles.addButton} onPress={() => setFormVisible((current) => !current)}>
          <Text style={styles.addButtonText}>{formVisible ? "Cancel" : "Add Official Ride"}</Text>
        </Pressable>
      </View>
      {formVisible ? (
        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={form.title} onChangeText={(value) => setField("title", value)} placeholder="Saturday Redline" placeholderTextColor={colors.dim} />
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={(value) => setField("description", value)} placeholder="Official club ride with pace line." placeholderTextColor={colors.dim} multiline />
          <Text style={styles.label}>Date & Time</Text>
          <TextInput style={styles.input} value={form.scheduled_at} onChangeText={(value) => setField("scheduled_at", value)} placeholder="2026-07-01 07:00" placeholderTextColor={colors.dim} />
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={form.meet_location} onChangeText={(value) => setField("meet_location", value)} placeholder="Clubhouse / Main Park" placeholderTextColor={colors.dim} />
          <Text style={styles.label}>Distance (km)</Text>
          <TextInput style={styles.input} value={form.distance_km} onChangeText={(value) => setField("distance_km", value)} placeholder="65" placeholderTextColor={colors.dim} keyboardType="numeric" />
          <Text style={styles.label}>Max riders</Text>
          <TextInput style={styles.input} value={form.max_riders} onChangeText={(value) => setField("max_riders", value)} placeholder="18" placeholderTextColor={colors.dim} keyboardType="numeric" />
          <Text style={styles.label}>Members to add</Text>
          <View style={styles.memberList}>
            {members.map((member) => (
              <Pressable key={member.id} style={[styles.memberChip, form.selectedMemberIds.includes(member.id) && styles.memberChipSelected]} onPress={() => toggleMember(member.id)}>
                <Text style={styles.memberText}>{member.full_name ?? member.email}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]} onPress={createRide} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? "Saving…" : "Create Official Ride"}</Text>
          </Pressable>
        </View>
      ) : null}
      {loading ? <Text style={styles.loading}>Loading official rides…</Text> : null}
      {rides.map((ride) => (
        <GroupRideCard key={ride.id} ride={ride} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  addButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  addButtonText: { color: colors.text, fontWeight: "900" },
  form: { gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: "top" },
  memberList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  memberChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceHigh },
  memberChipSelected: { backgroundColor: colors.primary },
  memberText: { color: colors.text },
  saveButton: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  saveButtonDisabled: { backgroundColor: colors.surface },
  saveButtonText: { color: colors.text, fontWeight: "900" },
  error: { color: colors.primary },
  success: { color: colors.primary, fontWeight: "900" },
  loading: { color: colors.muted }
});
