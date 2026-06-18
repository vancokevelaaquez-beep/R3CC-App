import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

export default function PendingReviewScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.icon}><Text style={styles.iconText}>TIME</Text></View>
      <Text style={styles.title}>Application Sent!</Text>
      <Text style={styles.copy}>Your profile is waiting for admin review. R3CC will unlock automatically when your status changes to approved.</Text>
      <View style={styles.tracker}>
        <Text style={styles.done}>Submitted: complete</Text>
        <Text style={styles.pending}>Admin review: pending</Text>
        <Text style={styles.locked}>Access granted: locked</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Locked until approval</Text>
        <Text style={styles.item}>Ride feed</Text>
        <Text style={styles.item}>GPS recording</Text>
        <Text style={styles.item}>Group rides</Text>
        <Text style={styles.item}>Invite codes</Text>
      </View>
      <Pressable style={styles.secondary} onPress={() => router.replace("/")}><Text style={styles.secondaryText}>Withdraw Application</Text></Pressable>
      <Link href="/login" asChild><Text style={styles.link}>Already approved? Sign in</Text></Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.background },
  icon: { alignSelf: "center", width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  iconText: { color: colors.primary, fontWeight: "900" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", textAlign: "center" },
  copy: { color: colors.muted, textAlign: "center", lineHeight: 22 },
  tracker: { gap: spacing.sm },
  done: { color: colors.success, fontWeight: "800" },
  pending: { color: colors.warning, fontWeight: "800" },
  locked: { color: colors.dim, fontWeight: "800" },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontWeight: "900" },
  item: { color: colors.muted },
  secondary: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  secondaryText: { color: colors.text, fontWeight: "900" },
  link: { color: colors.text, textAlign: "center", fontWeight: "800" }
});
