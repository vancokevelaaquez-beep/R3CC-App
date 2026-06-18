import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NotificationItem } from "@/components/NotificationItem";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const { notifications, markAllRead } = useNotifications(profile?.id);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.mark}>Mark all read</Text>
        </Pressable>
      </View>
      {notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  mark: { color: colors.primary, fontWeight: "900" }
});
