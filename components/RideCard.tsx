import { Image, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors, radii, shadows, spacing } from "@/constants/theme";
import { Ride } from "@/lib/types";
import { formatDuration } from "@/lib/haversine";
import { MemberAvatar } from "./MemberAvatar";
import { StatsPanel } from "./StatsPanel";

type Props = {
  ride: Ride;
  canManage?: boolean;
  saved?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onReact?: () => void;
  onComment?: (comment: string) => void;
};

export function RideCard({ ride, canManage, saved, onEdit, onDelete, onSave, onReact, onComment }: Props) {
  const name = ride.profile?.full_name ?? "R3CC Member";
  const [menuOpen, setMenuOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  async function shareRide() {
    await Share.share({ message: `${name}'s ride: ${ride.title} — ${ride.distance_km.toFixed(1)} km. ${ride.caption ?? ""}` });
  }

  function submitComment() {
    if (!comment.trim()) return;
    onComment?.(comment.trim());
    setComments((current) => [...current, comment.trim()]);
    setComment("");
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MemberAvatar name={name} uri={ride.profile?.avatar_url} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>@{ride.profile?.username ?? "member"} • {formatDuration(ride.duration_sec)}</Text>
        </View>
        {canManage ? (
          <View style={styles.menuWrap}>
            <Pressable style={styles.moreButton} onPress={() => setMenuOpen((open) => !open)} accessibilityRole="button" accessibilityLabel="Ride options">
              <Text style={styles.more}>•••</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.more}>...</Text>
        )}
      </View>
      {ride.photos?.length ? (
        <View style={styles.photos}>
          {ride.photos.map((photo) => (
            <Image key={photo} source={{ uri: photo }} style={styles.photo} />
          ))}
        </View>
      ) : null}
      <Text style={styles.caption}>{ride.caption}</Text>
      <StatsPanel
        stats={[
          { label: "Distance", value: `${ride.distance_km.toFixed(1)} km` },
          { label: "Elevation", value: `${ride.elevation_m.toFixed(0)} m` },
          { label: "Time", value: formatDuration(ride.duration_sec) }
        ]}
      />
      <View style={styles.actions}>
        <Pressable onPress={onReact} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="React to ride">
          <Text style={[styles.action, ride.reacted_by_me && styles.reacted]}>{ride.reacted_by_me ? "Liked" : "Like"} {ride.like_count ?? 0}</Text>
        </Pressable>
        <Pressable onPress={submitComment} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Comment on ride">
          <Text style={styles.action}>Comment {ride.comment_count ?? 0}</Text>
        </Pressable>
        <Pressable onPress={shareRide} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Share ride">
          <Text style={styles.action}>Share</Text>
        </Pressable>
        {onSave ? (
          <Pressable onPress={onSave} style={styles.actionButton} accessibilityRole="button" accessibilityLabel={saved ? "Unsave post" : "Save post"}>
            <Text style={[styles.action, saved && styles.saved]}>{saved ? "Saved" : "Save"}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.commentRow}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          onSubmitEditing={submitComment}
          placeholder="Write a comment"
          placeholderTextColor={colors.dim}
          style={styles.commentInput}
          returnKeyType="send"
        />
        <Pressable onPress={submitComment} style={styles.postCommentButton} accessibilityRole="button" accessibilityLabel="Post comment">
          <Text style={styles.postComment}>Post</Text>
        </Pressable>
      </View>
      {comments.length ? (
        <View style={styles.commentThread}>
          {comments.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.commentText}>• {item}</Text>
          ))}
        </View>
      ) : null}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.menu}>
            <Pressable style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit?.(); }}>
              <Text style={styles.menuText}>Edit ride</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenuOpen(false); onDelete?.(); }}>
              <Text style={[styles.menuText, styles.deleteAction]}>Delete ride</Text>
            </Pressable>
            <Pressable style={styles.cancelItem} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
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
  menuWrap: { position: "relative" },
  moreButton: { minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", padding: spacing.md, backgroundColor: "rgba(0,0,0,0.55)" },
  menu: { borderRadius: radii.lg, backgroundColor: colors.surface, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  menuItem: { alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  cancelItem: { alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.surfaceHigh },
  menuText: { color: colors.text, fontSize: 15, fontWeight: "800" },
  deleteAction: { color: colors.primary },
  photos: { gap: spacing.sm, overflow: "hidden" },
  photo: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
    resizeMode: "cover"
  },
  caption: {
    color: colors.text,
    lineHeight: 22
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  actionButton: { paddingVertical: 8 },
  action: {
    color: colors.muted,
    fontWeight: "700"
  },
  reacted: { color: colors.primary },
  saved: { color: colors.primary },
  commentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  commentInput: { flex: 1, minHeight: 40, paddingHorizontal: spacing.sm, borderRadius: radii.sm, color: colors.text, backgroundColor: colors.surfaceHigh },
  postCommentButton: { paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: radii.sm, backgroundColor: colors.surfaceHigh },
  postComment: { color: colors.primary, fontWeight: "900" },
  commentThread: { gap: spacing.xs },
  commentText: { color: colors.muted, fontSize: 13 }
});
