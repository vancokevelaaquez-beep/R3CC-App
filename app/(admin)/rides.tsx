import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { GroupRideCard } from "@/components/GroupRideCard";
import { colors, radii, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { GroupRide, Profile } from "@/lib/types";
import { groupRides as fallbackGroupRides } from "@/lib/mockData";

type AdminGroupRide = GroupRide & { rsvp_count?: number };
type ActivityLog = { id: string; message: string; created_at: string };

export default function AdminRideFeedScreen() {
  const [rides, setRides] = useState<AdminGroupRide[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<Pick<Profile, "id" | "full_name" | "email" | "role" | "status">[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_date: "",
    scheduled_time: "07:00",
    meet_location: "",
    selectedMemberIds: [] as string[]
  });

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
  }, [calendarMonth]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!hasSupabaseConfig) {
      setRides(fallbackGroupRides.map((ride) => ({ ...ride, rsvp_count: ride.rsvp_count ?? 0 })));
      setActivity([]);
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

      const { data: activityData } = await supabase.from("admin_activity_logs").select("id,message,created_at").order("created_at", { ascending: false }).limit(6);
      if (activityData) setActivity(activityData);
    } finally {
      setLoading(false);
    }
  }

  const setField = (key: Exclude<keyof typeof form, "selectedMemberIds">, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function selectDate(day: number) {
    const value = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setField("scheduled_date", value.toISOString().slice(0, 10));
    setDatePickerVisible(false);
  }

  const toggleMember = (id: string) => {
    setForm((current) => ({
      ...current,
      selectedMemberIds: current.selectedMemberIds.includes(id)
        ? current.selectedMemberIds.filter((memberId) => memberId !== id)
        : [...current.selectedMemberIds, id]
    }));
  };

  async function createRide() {
    if (!form.title || !form.scheduled_date || !form.scheduled_time || !form.meet_location) {
      notifyError("Title, scheduled date, and location are required.");
      return;
    }

    setSaving(true);
    try {
      if (!hasSupabaseConfig) {
        const ride: AdminGroupRide = { id: `demo-group-ride-${Date.now()}`, title: form.title, description: form.description, scheduled_at: new Date(`${form.scheduled_date}T${form.scheduled_time}:00`).toISOString(), distance_km: 0, meet_location: form.meet_location, rsvp_count: form.selectedMemberIds.length };
        setRides((current) => [ride, ...current]);
        setActivity((current) => [{ id: `activity-${Date.now()}`, message: `Created official ride: ${ride.title}`, created_at: new Date().toISOString() }, ...current]);
        setForm({ title: "", description: "", scheduled_date: "", scheduled_time: "07:00", meet_location: "", selectedMemberIds: [] });
        setFormVisible(false);
        notifySuccess("Official ride created successfully.");
        return;
      }
      const sessionResponse = await supabase.auth.getSession();
      const userId = sessionResponse.data?.session?.user?.id;
      if (!userId) {
        throw new Error("Admin session is required to create rides.");
      }

      const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}:00`).toISOString();

      const { data: rideData, error: createError } = await supabase
        .from("group_rides")
        .insert([
          {
            title: form.title,
            description: form.description,
            scheduled_at: scheduledAt,
            meet_location: form.meet_location,
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

      const activityMessage = `Created official ride: ${rideData.title}`;
      const { data: activityData, error: activityError } = await supabase.from("admin_activity_logs").insert({ admin_id: userId, action: "official_ride_created", message: activityMessage, metadata: { ride_id: rideData.id } }).select("id,message,created_at").single();
      if (activityError) console.error("Failed to log official ride creation:", activityError);
      if (activityData) setActivity((current) => [activityData, ...current].slice(0, 6));

      setRides((current) => [{ ...rideData, rsvp_count: form.selectedMemberIds.length }, ...current]);
      setForm({ title: "", description: "", scheduled_date: "", scheduled_time: "07:00", meet_location: "", selectedMemberIds: [] });
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
          <View style={styles.dateTimeRow}>
            <Pressable style={[styles.input, styles.pickerInput]} onPress={() => setDatePickerVisible(true)}><Text style={form.scheduled_date ? styles.pickerValue : styles.pickerPlaceholder}>{form.scheduled_date || "Choose date"}</Text></Pressable>
            <Pressable style={[styles.input, styles.pickerInput]} onPress={() => setTimePickerVisible(true)}><Text style={styles.pickerValue}>{form.scheduled_time}</Text></Pressable>
          </View>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={form.meet_location} onChangeText={(value) => setField("meet_location", value)} placeholder="Clubhouse / Main Park" placeholderTextColor={colors.dim} />
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
      <Modal visible={datePickerVisible} transparent animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.pickerModal}>
          <View style={styles.monthHeader}><Pressable onPress={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><Text style={styles.monthControl}>‹</Text></Pressable><Text style={styles.monthTitle}>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><Text style={styles.monthControl}>›</Text></Pressable></View>
          <View style={styles.weekdays}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}</View>
          <View style={styles.calendar}>{calendarDays.map((day, index) => day ? <Pressable key={day} style={[styles.day, form.scheduled_date === `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` && styles.selectedDay]} onPress={() => selectDate(day)}><Text style={styles.dayText}>{day}</Text></Pressable> : <View key={`blank-${index}`} style={styles.day} />)}</View>
          <Pressable onPress={() => setDatePickerVisible(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
      <Modal visible={timePickerVisible} transparent animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.pickerModal}>
          <Text style={styles.monthTitle}>Choose time</Text>
          <View style={styles.timeList}>{Array.from({ length: 48 }, (_, index) => { const hours = Math.floor(index / 4); const minutes = (index % 4) * 15; const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`; return <Pressable key={time} style={[styles.timeOption, form.scheduled_time === time && styles.selectedTime]} onPress={() => { setField("scheduled_time", time); setTimePickerVisible(false); }}><Text style={styles.dayText}>{time}</Text></Pressable>; })}</View>
          <Pressable onPress={() => setTimePickerVisible(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
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
  dateTimeRow: { flexDirection: "row", gap: spacing.sm },
  pickerInput: { flex: 1, justifyContent: "center" },
  pickerValue: { color: colors.text },
  pickerPlaceholder: { color: colors.dim },
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
  ,modalBackdrop: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.7)" },
  pickerModal: { gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthTitle: { color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  monthControl: { color: colors.primary, fontSize: 32, lineHeight: 34, paddingHorizontal: spacing.sm },
  weekdays: { flexDirection: "row" },
  weekday: { width: "14.285%", color: colors.muted, textAlign: "center", fontWeight: "800" },
  calendar: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.pill },
  selectedDay: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontWeight: "800" },
  timeList: { flexDirection: "row", flexWrap: "wrap", maxHeight: 300 },
  timeOption: { width: "25%", alignItems: "center", paddingVertical: spacing.sm, borderRadius: radii.sm },
  selectedTime: { backgroundColor: colors.primary },
  cancelText: { color: colors.primary, fontWeight: "900", textAlign: "center", paddingTop: spacing.sm }
});
