import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function PublicLandingScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Text style={styles.logo}>R3CC</Text>
        <Text style={styles.pill}>Private Group</Text>
      </View>
      <View style={styles.lock}><Text style={styles.lockText}>LOCK</Text></View>
      <Text style={styles.headline}>Members Only.</Text>
      <Text style={styles.tagline}>Ride. Record. Connect. Conquer.</Text>
      <View style={styles.preview}>
        <View style={styles.previewLine} />
        <View style={[styles.previewLine, { width: "74%" }]} />
        <View style={styles.blur} />
        <Text style={styles.hidden}>Private ride feed hidden</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>128 Members</Text>
        <Text style={styles.stat}>42k Monthly KM</Text>
        <Text style={styles.stat}>86 Rides/week</Text>
      </View>
      <Link href="/apply" asChild>
        <Pressable style={styles.cta}><Text style={styles.ctaText}>Apply to Join R3CC</Text></Pressable>
      </Link>
      <Link href="/login" asChild><Text style={styles.smallLink}>Member sign in</Text></Link>
      <Link href="/admin-login" asChild><Text style={styles.smallLink}>Admin access</Text></Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, minHeight: "100%" },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  pill: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, overflow: "hidden" },
  lock: { alignSelf: "center", marginTop: 36, width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  lockText: { color: colors.primary, fontWeight: "900" },
  headline: { color: colors.text, fontSize: typography.title, fontWeight: "900", textAlign: "center" },
  tagline: { color: colors.muted, textAlign: "center", fontSize: 16 },
  preview: { minHeight: 150, borderRadius: radii.lg, padding: spacing.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  previewLine: { height: 18, width: "92%", borderRadius: radii.pill, backgroundColor: colors.surfaceHigh, marginBottom: spacing.md },
  blur: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,10,0.72)" },
  hidden: { color: colors.text, alignSelf: "center", marginTop: 40, fontWeight: "900" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { color: colors.text, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.pill, overflow: "hidden", fontWeight: "800" },
  cta: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  ctaText: { color: colors.text, fontWeight: "900", fontSize: 16 },
  link: { color: colors.text, textAlign: "center", fontWeight: "800" },
  smallLink: { color: colors.muted, textAlign: "center" }
});
