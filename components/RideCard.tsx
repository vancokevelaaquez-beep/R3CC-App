import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, spacing } from "@/constants/theme";
import { Ride } from "@/lib/types";
import { formatDuration } from "@/lib/haversine";
import { MemberAvatar } from "./MemberAvatar";
import { RouteMap } from "./RouteMap";
import { StatsPanel } from "./StatsPanel";

export function RideCard({ ride }: { ride: Ride }) {
  const name = ride.profile?.full_name ?? "R3CC Member";

  return (
    <Pressable style={styles.card}>
      <View style={styles.header}>
        <MemberAvatar name={name} uri={ride.profile?.avatar_url} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>@{ride.profile?.username ?? "member"} | {formatDuration(ride.duration_sec)}</Text>
        </View>
        <Text style={styles.more}>...</Text>
      </View>
      <View style={styles.mapWrap}>
        <RouteMap coords={ride.route_coords} height={190} />
      </View>
      <StatsPanel
        stats={[
          { label: "Distance", value: `${ride.distance_km.toFixed(1)} km` },
          { label: "Avg", value: `${ride.avg_speed.toFixed(1)} kph` },
          { label: "Top", value: `${ride.top_speed.toFixed(0)} kph` }
        ]}
      />
      {ride.photos?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
          {ride.photos.map((photo) => (
            <View key={photo} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}
      <Text style={styles.caption}>{ride.caption}</Text>
      <View style={styles.actions}>
        <Text style={styles.action}>Heart {ride.like_count ?? 0}</Text>
        <Text style={styles.action}>Comment {ride.comment_count ?? 0}</Text>
        <Text style={styles.action}>Share</Text>
        <Text style={styles.action}>Save</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  headerText: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  meta: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12
  },
  more: {
    color: colors.muted,
    fontWeight: "900"
  },
  mapWrap: {
    overflow: "hidden",
    borderRadius: radii.md
  },
  photos: {
    marginTop: -4
  },
  photo: {
    width: 88,
    height: 88,
    marginRight: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHigh
  },
  caption: {
    color: colors.text,
    lineHeight: 22
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  action: {
    color: colors.muted,
    fontWeight: "700"
  }
});
