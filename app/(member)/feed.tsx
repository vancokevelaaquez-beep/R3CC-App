import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { RideCard } from "@/components/RideCard";
import { RouteMap } from "@/components/RouteMap";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";

export default function FeedScreen() {
  const { profile } = useAuth();
  const {
    rides,
    sharedRoutes,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    refreshFeed,
    loadMore,
    reactToRide,
    commentOnRide,
    deleteRide
  } = useFeed();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function confirmDelete(rideId: string) {
    Alert.alert("Delete ride?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(rideId);
          const result = await deleteRide(rideId);
          setDeletingId(null);
          if (!result.ok) {
            Alert.alert("Couldn't delete ride", result.error ?? "Please try again.");
          }
        }
      }
    ]);
  }

  const handleScrollEnd = useCallback(
    (nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const reachedBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
      if (reachedBottom && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loading, loadMore]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={refreshFeed} />}
      onScroll={({ nativeEvent }) => handleScrollEnd(nativeEvent)}
      scrollEventThrottle={200}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>R3CC</Text>
        <Pressable
          onPress={() => router.push("/(member)/notifications")}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          style={styles.notificationsButton}
        >
          <Text style={styles.notificationsText}>Notifications</Text>
        </Pressable>
      </View>

      {sharedRoutes.length ? (
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Shared routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesRow}>
            {sharedRoutes.map((route) => (
              <Pressable key={route.id} style={styles.routeCard} onPress={() => router.push("/(member)/routes")}>
                <RouteMap coords={route.coords} height={110} />
                <Text style={styles.routeTitle} numberOfLines={1}>{route.title}</Text>
                <Text style={styles.routeMeta}>{route.distance_km.toFixed(1)} km · {route.difficulty}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refreshFeed} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && !rides.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No rides in the feed yet</Text>
          <Text style={styles.emptyCopy}>Record a ride and share it publicly to get the pack rolling.</Text>
        </View>
      ) : null}

      <View style={styles.feedList}>
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            canManage={Boolean(profile && ride.user_id === profile.id)}
            onReact={() => reactToRide(ride.id)}
            onComment={() => commentOnRide(ride.id)}
            onDelete={() => confirmDelete(ride.id)}
          />
        ))}
      </View>

      {loadingMore || deletingId ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { color: colors.text, fontSize: 24, fontWeight: "900" },
  notificationsButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  notificationsText: { color: colors.primary, fontWeight: "800" },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: spacing.sm },
  routesSection: { gap: spacing.xs },
  routesRow: { gap: spacing.sm },
  routeCard: { width: 200, gap: spacing.xs, padding: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg },
  routeTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  routeMeta: { color: colors.muted, fontSize: 12 },
  loader: { marginVertical: spacing.md },
  errorBox: { alignItems: "center", gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  errorText: { color: colors.warning, textAlign: "center" },
  retryButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: colors.surfaceHigh },
  retryText: { color: colors.primary, fontWeight: "800" },
  empty: { alignItems: "center", gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontWeight: "900", fontSize: 18 },
  emptyCopy: { color: colors.muted, textAlign: "center" },
  feedList: { gap: spacing.md }
});