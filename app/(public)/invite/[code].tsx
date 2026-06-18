import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

export default function InviteCodeEntryScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [inputCode, setInputCode] = useState("");

  useEffect(() => {
    setInputCode(code === "manual" ? "" : code ?? "");
  }, [code]);

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>R3CC</Text>
      <Text style={styles.title}>Invite Code</Text>
      <Text style={styles.copy}>Enter your member invite code to prefill your application and flag your referral.</Text>
      <TextInput value={inputCode} onChangeText={setInputCode} placeholder="R3CC-AJ-7X" placeholderTextColor={colors.dim} style={styles.input} />
      <Link href={{ pathname: "/apply", params: { referred_by: inputCode } }} asChild>
        <Pressable style={styles.button}><Text style={styles.buttonText}>Continue to Application</Text></Pressable>
      </Link>
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
  buttonText: { color: colors.text, fontWeight: "900" }
});
