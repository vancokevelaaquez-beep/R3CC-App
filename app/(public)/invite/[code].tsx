import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function InviteCodeEntryScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [inputCode, setInputCode] = useState("");
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputCode(code === "manual" ? "" : code ?? "");
  }, [code]);

  useEffect(() => {
    validateInviteCode(inputCode.trim().toUpperCase());
  }, [inputCode]);

  async function validateInviteCode(value: string) {
    setValid(false);
    setError("");

    if (!value) {
      return;
    }

    if (!hasSupabaseConfig) {
      setValid(true);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("invites")
      .select("code, used_by")
      .eq("code", value)
      .single();
    setLoading(false);

    if (error || !data) {
      setError("Invite code not found.");
      return;
    }
    if (data.used_by) {
      setError("Invite code has already been used.");
      return;
    }

    setValid(true);
  }

  function handleContinue() {
    if (!valid || loading) {
      return;
    }

    router.push({ pathname: "/apply", params: { referred_by: inputCode.trim().toUpperCase() } });
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>R3CC</Text>
      <Text style={styles.title}>Invite Code</Text>
      <Text style={styles.copy}>Enter your member invite code to prefill your application and flag your referral.</Text>
      <TextInput
        value={inputCode}
        onChangeText={(value) => setInputCode(value.trim().toUpperCase())}
        placeholder="R3CC-AJ-7X"
        placeholderTextColor={colors.dim}
        style={styles.input}
        autoCapitalize="characters"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, (!valid || loading) ? styles.buttonDisabled : null]}
        onPress={handleContinue}
        disabled={!valid || loading}
      >
        <Text style={styles.buttonText}>{loading ? "Validating…" : "Continue to Application"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.background },
  logo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  copy: { color: colors.muted, lineHeight: 22 },
  input: { minHeight: 54, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" },
  buttonDisabled: { backgroundColor: colors.surface },
  error: { color: colors.primary, textAlign: "center" }
});
