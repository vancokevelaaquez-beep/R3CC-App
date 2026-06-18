import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";

export default function MemberLoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("member@r3cc.app");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  async function submit() {
    try {
      const result = await signIn(email, password);
      if (result.status === "approved") router.replace("/(member)/feed");
      else if (result.status === "pending") router.replace("/pending");
      else setError("Your application was declined. You can reapply from the public form.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>R3CC</Text>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.dim} style={styles.input} autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.dim} style={styles.input} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit}><Text style={styles.buttonText}>Sign In</Text></Pressable>
      <View style={styles.socials}>
        <Pressable style={styles.social}><Text style={styles.socialText}>Apple</Text></Pressable>
        <Pressable style={styles.social}><Text style={styles.socialText}>Google</Text></Pressable>
      </View>
      <Link href="/apply" asChild><Text style={styles.link}>New to R3CC? Apply to join</Text></Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.background },
  logo: { color: colors.text, fontSize: 32, fontWeight: "900", textAlign: "center" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: spacing.md },
  input: { minHeight: 54, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" },
  socials: { flexDirection: "row", gap: spacing.sm },
  social: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  socialText: { color: colors.text, fontWeight: "800" },
  link: { color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  error: { color: colors.primary, textAlign: "center" }
});
