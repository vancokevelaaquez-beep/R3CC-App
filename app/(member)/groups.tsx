import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { Link } from "expo-router";
import { GroupRideCard } from "@/components/GroupRideCard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";
import { groupRides } from "@/lib/mockData";

type MemberGroup = {
  id: string;
  name: string;
  description: string;
  members: number;
  isJoined: boolean;
  isPrivate: boolean;
};

const defaultGroups: MemberGroup[] = [
  {
    id: "group-1",
    name: "R3CC Official Club",
    description: "Private rides, training plans, and weekend outings.",
    members: 128,
    isJoined: true,
    isPrivate: true
  },
  {
    id: "group-2",
    name: "Weekend Pace Line",
    description: "Saturday morning tempo loops and recovery rolls.",
    members: 84,
    isJoined: false,
    isPrivate: false
  },
  {
    id: "group-3",
    name: "Gravel Junkies",
    description: "Off-road adventures and mixed-terrain coffee runs.",
    members: 66,
    isJoined: false,
    isPrivate: false
  }
];

export default function GroupsScreen() {
  const [groups, setGroups] = useState<MemberGroup[]>(defaultGroups);
  const [query, setQuery] = useState("");
  const [isFormVisible, setFormVisible] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", isPrivate: false });

  const filteredGroups = useMemo(
    () => groups.filter((group) => {
      const search = query.trim().toLowerCase();
      return (
        !search ||
        group.name.toLowerCase().includes(search) ||
        group.description.toLowerCase().includes(search)
      );
    }),
    [groups, query]
  );

  const handleToggleJoin = (groupId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              isJoined: !group.isJoined,
              members: group.isJoined ? Math.max(group.members - 1, 0) : group.members + 1
            }
          : group
      )
    );
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      return;
    }

    const newGroupItem: MemberGroup = {
      id: `group-${Date.now()}`,
      name: newGroup.name.trim(),
      description: newGroup.description.trim() || "A new group for riders.",
      members: 1,
      isJoined: true,
      isPrivate: newGroup.isPrivate
    };

    setGroups((current) => [newGroupItem, ...current]);
    setNewGroup({ name: "", description: "", isPrivate: false });
    setFormVisible(false);
  };

  const joinedGroups = groups.filter((group) => group.isJoined);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Groups</Text>
        <Pressable style={styles.createButton} onPress={() => setFormVisible((current) => !current)}>
          <Text style={styles.createButtonText}>{isFormVisible ? "Cancel" : "Create Group"}</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search groups"
        placeholderTextColor={colors.dim}
        style={styles.searchInput}
      />

      {isFormVisible ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New group details</Text>
          <TextInput
            value={newGroup.name}
            onChangeText={(value) => setNewGroup((current) => ({ ...current, name: value }))}
            placeholder="Group name"
            placeholderTextColor={colors.dim}
            style={styles.input}
          />
          <TextInput
            value={newGroup.description}
            onChangeText={(value) => setNewGroup((current) => ({ ...current, description: value }))}
            placeholder="Description"
            placeholderTextColor={colors.dim}
            style={[styles.input, styles.textarea]}
            multiline
          />
          <Pressable
            style={[styles.button, newGroup.name.trim() ? styles.button : styles.buttonDisabled]}
            onPress={handleCreateGroup}
            disabled={!newGroup.name.trim()}
          >
            <Text style={styles.buttonText}>Create group</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.section}>Your groups</Text>
      {joinedGroups.length ? (
        joinedGroups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupMeta}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>
            <View style={styles.groupFooter}>
              <Text style={styles.groupBadge}>{group.isPrivate ? "Private" : "Open"}</Text>
              <View style={styles.footerActions}>
                <Link href={`/(member)/groups/${group.id}`} asChild>
                  <Pressable style={[styles.joinButton, styles.viewButton]}>
                    <Text style={styles.joinButtonText}>View</Text>
                  </Pressable>
                </Link>
                <Pressable style={[styles.joinButton, styles.joined]} onPress={() => handleToggleJoin(group.id)}>
                  <Text style={styles.joinButtonText}>Leave</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>You are not a member of any groups yet.</Text>
      )}

      <Text style={styles.section}>Browse groups</Text>
      {filteredGroups.length ? (
        filteredGroups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupMeta}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>
            <View style={styles.groupFooter}>
              <Text style={styles.groupBadge}>{group.isPrivate ? "Private" : "Open"}</Text>
              {group.isJoined ? (
                <Link href={`/(member)/groups/${group.id}`} asChild>
                  <Pressable style={[styles.joinButton, styles.viewButton]}>
                    <Text style={styles.joinButtonText}>View</Text>
                  </Pressable>
                </Link>
              ) : (
                <Pressable style={styles.joinButton} onPress={() => handleToggleJoin(group.id)}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No groups match your search.</Text>
      )}

      <Text style={styles.section}>Upcoming Group Rides</Text>
      {groupRides.map((ride) => (
        <GroupRideCard key={ride.id} ride={ride} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  title: { color: colors.text, fontSize: 32, fontWeight: "900" },
  createButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  createButtonText: { color: colors.text, fontWeight: "900" },
  searchInput: { color: colors.text, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  formCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.text, fontWeight: "900" },
  input: { color: colors.text, backgroundColor: colors.surfaceHigh, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  button: { alignItems: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  buttonDisabled: { backgroundColor: colors.surface },
  buttonText: { color: colors.text, fontWeight: "900" },
  groupCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  groupMeta: { gap: spacing.xs },
  groupName: { color: colors.text, fontWeight: "900" },
  groupDescription: { color: colors.muted },
  groupFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  groupBadge: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  joinButton: { alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  joined: { backgroundColor: colors.surfaceHigh },
  joinButtonText: { color: colors.text, fontWeight: "900" },
  emptyText: { color: colors.muted, fontStyle: "italic" }
});
