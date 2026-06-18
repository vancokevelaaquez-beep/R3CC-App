import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

export function MemberAvatar({ name, uri, size = 44 }: Props) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.avatar, styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: colors.border
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh
  },
  initials: {
    color: colors.text,
    fontWeight: "800"
  }
});
