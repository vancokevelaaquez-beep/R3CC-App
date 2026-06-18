import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@r3cc.app");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  async function submit() {
    try {
      const result = await signIn(email, password);
      if (result.role !== "admin") {
        setError("Admin role required.");
        return;
      }
      router.replace("/(admin)/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>R3CC</Text>
      <Text style={styles.badge}>SHIELD</Text>
      <Text style={styles.title}>Admin Access</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.dim} style={styles.input} autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.dim} style={styles.input} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit}><Text style={styles.buttonText}>Sign In</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.background },
  logo: { color: colors.text, fontSize: 32, fontWeight: "900", textAlign: "center" },
  badge: { alignSelf: "center", color: colors.primary, borderColor: colors.primary, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  title: { color: colors.primary, fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: spacing.md },
  input: { minHeight: 54, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" },
  error: { color: colors.primary, textAlign: "center" }
});
