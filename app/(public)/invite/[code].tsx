import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

export default function InviteCodeEntryScreen() {
  const [message, setMessage] = useState("This invite page has been disabled.");

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>R3CC</Text>
      <Text style={styles.title}>Invite Disabled</Text>
      <Text style={styles.copy}>Invite entry is no longer available here. If you have been invited, use the APK and then sign in from the app.</Text>
      <Pressable style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.background },
  logo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  copy: { color: colors.muted, lineHeight: 22 },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: "900" }
});
