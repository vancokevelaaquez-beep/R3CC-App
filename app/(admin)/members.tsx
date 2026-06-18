import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";

const members = ["Ari Santos", "Mika Reyes", "Jules Tan", "Noah Cruz"];

export default function AdminMembersScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Members</Text>
      <TextInput placeholder="Search members" placeholderTextColor={colors.dim} style={styles.input} />
      <View style={styles.filters}>{["All", "Active", "Inactive", "Admins"].map((filter) => <Text key={filter} style={styles.filter}>{filter}</Text>)}</View>
      {members.map((name, index) => (
        <View key={name} style={styles.row}>
          <MemberAvatar name={name} />
          <View style={styles.copy}><Text style={styles.name}>{name}</Text><Text style={styles.meta}>{42 + index * 8} rides | {1200 + index * 420} km</Text></View>
          <Text style={styles.status}>{index === 0 ? "Admin" : "Active"}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filters: { flexDirection: "row", gap: spacing.sm },
  filter: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  copy: { flex: 1 },
  name: { color: colors.text, fontWeight: "900" },
  meta: { color: colors.muted, marginTop: 3 },
  status: { color: colors.primary, fontWeight: "900" }
});
