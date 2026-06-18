import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

export function InviteQuotaBar({ used, quota }: { used: number; quota: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Invite Quota</Text>
        <Text style={styles.count}>{Math.max(quota - used, 0)} left</Text>
      </View>
      <View style={styles.slots}>
        {Array.from({ length: quota }).map((_, index) => (
          <View key={index} style={[styles.slot, index < used ? styles.used : styles.open]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontWeight: "900"
  },
  count: {
    color: colors.primary,
    fontWeight: "900"
  },
  slots: {
    flexDirection: "row",
    gap: spacing.xs
  },
  slot: {
    flex: 1,
    height: 10,
    borderRadius: radii.pill
  },
  used: {
    backgroundColor: colors.primary
  },
  open: {
    backgroundColor: colors.surfaceHigh
  }
});
