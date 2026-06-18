import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import { Notification } from "@/lib/types";

const iconByType: Record<Notification["type"], string> = {
  like: "H",
  comment: "M",
  group_ride: "G",
  approved: "S",
  invite_accepted: "+",
  pr: "T",
  streak: "F"
};

export function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}><Text style={styles.iconText}>{iconByType[notification.type]}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>Just now</Text>
      </View>
      {!notification.is_read ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  iconText: {
    color: colors.text,
    fontWeight: "900"
  },
  copy: {
    flex: 1
  },
  message: {
    color: colors.text,
    fontWeight: "700"
  },
  time: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary
  }
});
