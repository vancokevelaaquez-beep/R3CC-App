import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

type Stat = {
  label: string;
  value: string;
};

export function StatsPanel({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.panel}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.item}>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(22,22,22,0.88)",
    borderWidth: 1,
    borderColor: colors.border
  },
  item: {
    flex: 1
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  label: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase"
  }
});
