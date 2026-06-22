import { router, useLocalSearchParams } from "expo-router";
import { ComponentProps, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

const levels = ["beginner", "intermediate", "advanced", "elite"];

export default function ApplicationFormScreen() {
  const { referred_by } = useLocalSearchParams<{ referred_by?: string }>();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "", instagram: "", riding_level: "intermediate", weekly_km: "100-150", reason: "", referred_by: referred_by ? referred_by.trim().toUpperCase() : "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteValid, setInviteValid] = useState(true);
  const [inviteChecking, setInviteChecking] = useState(false);

  useEffect(() => {
    if (referred_by) {
      setForm((current) => ({ ...current, referred_by }));
    }
  }, [referred_by]);

  useEffect(() => {
    if (form.confirm_password && form.password !== form.confirm_password) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  }, [form.password, form.confirm_password]);

  useEffect(() => {
    validateInviteCode(form.referred_by);
  }, [form.referred_by]);

  async function validateInviteCode(code: string) {
    if (!code) {
      setInviteValid(true);
      setInviteError("");
      return;
    }

    if (!hasSupabaseConfig) {
      setInviteValid(true);
      setInviteError("");
      return;
    }

    setInviteChecking(true);
    const { data, error } = await supabase
      .from("invites")
      .select("code, used_by")
      .eq("code", code)
      .single();
    setInviteChecking(false);

    if (error || !data) {
      setInviteValid(false);
      setInviteError("Invite code not found.");
      return;
    }
    if (data.used_by) {
      setInviteValid(false);
      setInviteError("Invite code has already been used.");
      return;
    }

    setInviteValid(true);
    setInviteError("");
  }

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    setError("");
    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      setError("Please complete all required fields.");
      return;
    }
    if (!inviteValid) {
      setError(inviteError || "Invalid invite code.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (hasSupabaseConfig) {
        const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (error) throw error;
        await supabase.from("profiles").upsert({ id: data.user?.id, full_name: form.full_name, email: form.email, role: "member", status: "pending", riding_level: form.riding_level, weekly_km: form.weekly_km, instagram: form.instagram });
        await supabase.from("applications").insert({ user_id: data.user?.id, full_name: form.full_name, instagram: form.instagram, riding_level: form.riding_level, weekly_km: form.weekly_km, reason: form.reason, referred_by: form.referred_by, status: "pending" });
        if (form.referred_by) {
          await supabase
            .from("invites")
            .update({ used_by: data.user?.id, used_at: new Date().toISOString() })
            .eq("code", form.referred_by);
        }
      }
      router.replace("/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>R3CC</Text>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} /></View>
      <Text style={styles.title}>{step === 1 ? "Account" : step === 2 ? "Cycling Profile" : "Review"}</Text>
      {step === 1 ? (
        <View style={styles.card}>
          <Input label="Full name *" value={form.full_name} onChangeText={(value) => setField("full_name", value)} />
          <Input label="Email *" value={form.email} onChangeText={(value) => setField("email", value)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={form.password} onChangeText={(value) => setField("password", value)} secureTextEntry />
          <Input label="Confirm password" value={form.confirm_password} onChangeText={(value) => setField("confirm_password", value)} secureTextEntry errorText={confirmError} />
        </View>
      ) : null}
      {step === 2 ? (
        <View style={styles.card}>
          <Input label="Instagram" value={form.instagram} onChangeText={(value) => setField("instagram", value)} />
          <Text style={styles.label}>Riding level</Text>
          <View style={styles.pills}>{levels.map((level) => <Pressable key={level} style={[styles.level, form.riding_level === level && styles.levelActive]} onPress={() => setField("riding_level", level)}><Text style={styles.levelText}>{level}</Text></Pressable>)}</View>
          <Input label="Weekly km" value={form.weekly_km} onChangeText={(value) => setField("weekly_km", value)} />
          <Input label="Why R3CC?" value={form.reason} onChangeText={(value) => setField("reason", value)} multiline />
          <Input label="Referred by" value={form.referred_by} onChangeText={(value) => setField("referred_by", value)} errorText={inviteError} />
        </View>
      ) : null}
      {step === 3 ? (
        <View style={styles.card}>
          <Summary label="Name" value={form.full_name} />
          <Summary label="Email" value={form.email} />
          <Summary label="Level" value={form.riding_level} />
          <Summary label="Weekly" value={`${form.weekly_km} km`} />
          <Summary label="Reason" value={form.reason || "No reason entered"} />
          <Summary label="Referred by" value={form.referred_by || "None"} />
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.secondary}
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.secondaryText}>{step > 1 ? "Back" : "Cancel"}</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={step === 3 ? submit : () => setStep(step + 1)} disabled={submitting}>
          <Text style={styles.primaryText}>{step === 3 ? (submitting ? "Submitting" : "Submit") : "Next"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Input(props: ComponentProps<typeof TextInput> & { label: string; errorText?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.dim}
        style={[styles.input, props.multiline && styles.textarea, props.errorText ? styles.inputError : null]}
      />
      {props.errorText ? <Text style={styles.fieldError}>{props.errorText}</Text> : null}
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <Text style={styles.summary}><Text style={styles.summaryLabel}>{label}: </Text>{value}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  logo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  progress: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceHigh, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: colors.primary },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  field: { gap: spacing.xs },
  label: { color: colors.muted, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: radii.sm, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surfaceHigh },
  textarea: { minHeight: 110, paddingTop: spacing.md, textAlignVertical: "top" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  level: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.surfaceHigh },
  levelActive: { backgroundColor: colors.primary },
  levelText: { color: colors.text, fontWeight: "800" },
  summary: { color: colors.text, lineHeight: 23 },
  summaryLabel: { color: colors.muted, fontWeight: "900" },
  actions: { flexDirection: "row", gap: spacing.sm },
  primary: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  primaryText: { color: colors.text, fontWeight: "900" },
  secondary: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  secondaryText: { color: colors.text, fontWeight: "900" },
  fieldError: { color: colors.primary, marginTop: spacing.xs },
  inputError: { borderColor: colors.primary, borderWidth: 1 }
});

