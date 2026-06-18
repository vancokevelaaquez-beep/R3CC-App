import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { MemberAvatar } from "./MemberAvatar";

type Props = {
  name: string;
  handle: string;
  level: string;
  weeklyKm: string;
  reason: string;
  referredBy?: string;
  onApprove?: () => void;
  onDecline?: () => void;
};

export function ApplicationCard({ name, handle, level, weeklyKm, reason, referredBy, onApprove, onDecline }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MemberAvatar name={name} />
        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>@{handle} | {level} | {weeklyKm} km/wk</Text>
        </View>
      </View>
      <Text style={styles.quote}>"{reason}"</Text>
      {referredBy ? <Text style={styles.referred}>Referred by {referredBy}</Text> : null}
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.approve]} onPress={onApprove}><Text style={styles.buttonText}>Approve</Text></Pressable>
        <Pressable style={[styles.button, styles.decline]} onPress={onDecline}><Text style={styles.buttonText}>Decline</Text></Pressable>
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
    alignItems: "center",
    gap: spacing.sm
  },
  identity: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16
  },
  meta: {
    color: colors.muted,
    marginTop: 3
  },
  quote: {
    color: colors.text,
    lineHeight: 22
  },
  referred: {
    color: colors.muted
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.sm
  },
  approve: {
    backgroundColor: colors.success
  },
  decline: {
    backgroundColor: colors.primary
  },
  buttonText: {
    color: colors.text,
    fontWeight: "900"
  }
});
