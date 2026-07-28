import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RideCard } from "@/components/RideCard";
import { colors, radii, spacing } from "@/constants/theme";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { Ride } from "@/lib/types";

function SharedRouteCard({ route }: { route: { id: string; title: string; distance_km: number; difficulty: string; elevation_m: number; is_shared: boolean; profile?: { full_name: string; username: string } } }) {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        {route.is_shared ? <Text style={styles.sharedPill}>Shared</Text> : null}
      </View>
      <Text style={styles.routeMember}>Shared by {route.profile?.full_name ?? "R3CC Member"}</Text>
      <Text style={styles.routeMeta}>{route.distance_km} km · {route.difficulty} · {route.elevation_m} m</Text>
    </View>
  );
}

export default function HomeFeedScreen() {
  const { rides, sharedRoutes, updateRide, deleteRide, reactToRide, commentOnRide } = useFeed();
  const { profile, session } = useAuth();
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [deletingRide, setDeletingRide] = useState<Ride | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [caption, setCaption] = useState("");

  function startEditing(ride: Ride) {
    setCaption(ride.caption ?? "");
    setEditingRide(ride);
  }

  async function saveEdit() {
    if (!editingRide) return;
    if (await updateRide(editingRide.id, { caption })) setEditingRide(null);
    else Alert.alert("Unable to update ride", "Please try again.");
  }

  function confirmDelete(ride: Ride) {
    setDeletingRide(ride);
  }

  async function deleteSelectedRide() {
    if (!deletingRide || isDeleting) return;
    setIsDeleting(true);
    const result = await deleteRide(deletingRide.id);
    setIsDeleting(false);
    if (result.ok) {
      setDeletingRide(null);
      return;
    }
    Alert.alert("Unable to delete ride", result.error ?? "Please try again.");
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
          <View style={styles.headerActions}>
            <Link href="/(member)/notifications" asChild><Pressable style={styles.icon}><Text style={styles.iconText}>B</Text></Pressable></Link>
            <Pressable style={styles.icon}><Text style={styles.iconText}>S</Text></Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {["Official", "Climbers", "Sprinters", "Cafe"].map((story) => <View key={story} style={styles.story}><Text style={styles.storyText}>{story}</Text></View>)}
        </ScrollView>
        {sharedRoutes.length ? (
          <View>
            <Text style={styles.section}>Shared routes</Text>
            {sharedRoutes.map((route) => <SharedRouteCard key={route.id} route={route} />)}
          </View>
        ) : null}
        {rides.map((ride) => <RideCard key={ride.id} ride={ride} canManage={ride.user_id === (session?.user.id ?? profile?.id)} onEdit={() => startEditing(ride)} onDelete={() => confirmDelete(ride)} onReact={() => reactToRide(ride.id)} onComment={() => commentOnRide(ride.id)} />)}
      </ScrollView>
      <Link href="/(member)/record" asChild><Pressable style={styles.fab}><Text style={styles.fabText}>BIKE</Text></Pressable></Link>
      <Modal visible={Boolean(editingRide)} transparent animationType="fade" onRequestClose={() => setEditingRide(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit ride caption</Text>
          <TextInput value={caption} onChangeText={setCaption} multiline style={styles.editInput} placeholder="Add a caption" placeholderTextColor={colors.dim} />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={() => setEditingRide(null)}><Text style={styles.buttonText}>Cancel</Text></Pressable>
            <Pressable style={styles.saveButton} onPress={saveEdit}><Text style={styles.buttonText}>Save</Text></Pressable>
          </View>
        </View></View>
      </Modal>
      <Modal visible={Boolean(deletingRide)} transparent animationType="fade" onRequestClose={() => setDeletingRide(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Delete ride?</Text>
          <Text style={styles.modalMessage}>This permanently removes this ride and its photos from the feed.</Text>
          <View style={styles.modalActions}>
            <Pressable disabled={isDeleting} style={styles.cancelButton} onPress={() => setDeletingRide(null)}><Text style={styles.buttonText}>Cancel</Text></Pressable>
            <Pressable disabled={isDeleting} style={[styles.deleteButton, isDeleting && styles.buttonDisabled]} onPress={deleteSelectedRide}><Text style={styles.buttonText}>{isDeleting ? "Deleting..." : "Delete"}</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  iconText: { color: colors.text, fontWeight: "900" },
  stories: { gap: spacing.sm },
  story: { width: 92, height: 92, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  storyText: { color: colors.text, fontWeight: "800" },
  section: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: spacing.lg, marginBottom: spacing.sm },
  routeCard: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeTitle: { color: colors.text, fontWeight: "900" },
  sharedPill: { color: colors.primary, fontWeight: "900" },
  routeMeta: { color: colors.muted, marginTop: spacing.xs },
  routeMember: { color: colors.text, fontWeight: "700" },
  fab: { position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  fabText: { color: colors.text, fontWeight: "900", fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.65)" },
  modal: { gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  editInput: { minHeight: 100, padding: spacing.md, borderRadius: radii.md, color: colors.text, backgroundColor: colors.surfaceHigh, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  cancelButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surfaceHigh },
  saveButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary },
  deleteButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonDisabled: { opacity: 0.6 },
  modalMessage: { color: colors.muted, lineHeight: 21 },
  buttonText: { color: colors.text, fontWeight: "900" }
});
