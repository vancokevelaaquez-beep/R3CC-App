import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useSearchParams } from "expo-router";
import { GroupRideCard } from "@/components/GroupRideCard";
import { MemberAvatar } from "@/components/MemberAvatar";
import { colors, radii, spacing } from "@/constants/theme";

type GroupMember = {
  id: string;
  name: string;
  handle: string;
};

type GroupRidePreview = {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  distance_km: number;
  meet_location: string;
  rsvp_count: number;
  photo: string;
};

type GroupDetail = {
  id: string;
  name: string;
  description: string;
  members: number;
  isPrivate: boolean;
  memberList: GroupMember[];
  photos: { id: string; uri: string; caption: string }[];
  rides: GroupRidePreview[];
};

const groupDetails: Record<string, GroupDetail> = {
  "group-1": {
    id: "group-1",
    name: "R3CC Official Club",
    description: "Private rides, training plans, and weekend outings for the core crew.",
    members: 128,
    isPrivate: true,
    memberList: [
      { id: "m1", name: "Ari Santos", handle: "arisprints" },
      { id: "m2", name: "Mika Reyes", handle: "mikaclimbs" },
      { id: "m3", name: "Jules Tan", handle: "juleswheels" },
      { id: "m4", name: "Noah Cruz", handle: "noahgears" }
    ],
    photos: [
      { id: "p1", uri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80", caption: "Sunday sunrise roll" },
      { id: "p2", uri: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=700&q=80", caption: "Clubhouse meetup" },
      { id: "p3", uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80", caption: "Finish-line coffee" }
    ],
    rides: [
      {
        id: "ride-1",
        title: "Saturday Redline",
        description: "Endurance pace ride with rotating pulls and a fast final segment.",
        scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        distance_km: 68,
        meet_location: "R3CC Clubhouse",
        rsvp_count: 12,
        photo: "https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=700&q=80"
      },
      {
        id: "ride-2",
        title: "Tuesday Tempo",
        description: "Midweek fast group ride with tempo intervals and cafe stop.",
        scheduled_at: new Date(Date.now() + 86400000 * 4).toISOString(),
        distance_km: 52,
        meet_location: "Riverfront Park",
        rsvp_count: 18,
        photo: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=700&q=80"
      }
    ]
  },
  "group-2": {
    id: "group-2",
    name: "Weekend Pace Line",
    description: "Saturday morning tempo loops and recovery rolls for consistent training.",
    members: 84,
    isPrivate: false,
    memberList: [
      { id: "m5", name: "Sam Perez", handle: "sampaces" },
      { id: "m6", name: "Lina Gomez", handle: "linaclimbs" },
      { id: "m7", name: "Theo Kim", handle: "theoturbo" }
    ],
    photos: [
      { id: "p4", uri: "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=700&q=80", caption: "Saturday regroup" },
      { id: "p5", uri: "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?auto=format&fit=crop&w=700&q=80", caption: "Group sprint" }
    ],
    rides: [
      {
        id: "ride-3",
        title: "Pace Line Express",
        description: "Fast tempo with sustained effort and rotating pulls.",
        scheduled_at: new Date(Date.now() + 86400000 * 6).toISOString(),
        distance_km: 74,
        meet_location: "Eastside Bridge",
        rsvp_count: 20,
        photo: "https://images.unsplash.com/photo-1471011487170-45f5a1f8b6b4?auto=format&fit=crop&w=700&q=80"
      }
    ]
  },
  "group-3": {
    id: "group-3",
    name: "Gravel Junkies",
    description: "Mixed-terrain adventures and off-road photo rides.",
    members: 66,
    isPrivate: false,
    memberList: [
      { id: "m8", name: "Elena Bright", handle: "elenagravel" },
      { id: "m9", name: "Omar Malik", handle: "omarmud" },
      { id: "m10", name: "Zara Lee", handle: "zarabah" }
    ],
    photos: [
      { id: "p6", uri: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=80", caption: "Forest track" },
      { id: "p7", uri: "https://images.unsplash.com/photo-1468071174046-657d9d351a40?auto=format&fit=crop&w=700&q=80", caption: "Gravel line" }
    ],
    rides: [
      {
        id: "ride-4",
        title: "Mixed Surface Escape",
        description: "Gravel and pavement loop with scenic photo stops.",
        scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        distance_km: 59,
        meet_location: "North Farm Parking",
        rsvp_count: 9,
        photo: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80"
      }
    ]
  }
};

export default function GroupDetailScreen() {
  const params = useSearchParams();
  const groupId = String(params.groupId || "group-1");
  const group = groupDetails[groupId] || groupDetails["group-1"];

  const upcomingRides = useMemo(
    () => group.rides.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [group]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Link href="/(member)/groups" asChild>
          <Text style={styles.back}>← Groups</Text>
        </Link>
        <Text style={styles.headerBadge}>{group.isPrivate ? "Private" : "Open"}</Text>
      </View>

      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.description}>{group.description}</Text>
      <Text style={styles.subtext}>{group.members} members</Text>

      <Text style={styles.section}>Members</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
        {group.memberList.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <MemberAvatar name={member.name} size={56} />
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberHandle}>@{member.handle}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.section}>Photos</Text>
      <View style={styles.photoGrid}>
        {group.photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            <Text style={styles.photoCaption}>{photo.caption}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Group rides</Text>
      {upcomingRides.map((ride) => (
        <View key={ride.id} style={styles.rideCardWrapper}>
          <GroupRideCard
            ride={{
              id: ride.id,
              title: ride.title,
              description: ride.description,
              scheduled_at: ride.scheduled_at,
              distance_km: ride.distance_km,
              meet_location: ride.meet_location,
              rsvp_count: ride.rsvp_count
            }}
          />
          <Image source={{ uri: ride.photo }} style={styles.ridePhoto} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: colors.primary, fontWeight: "900" },
  headerBadge: { color: colors.text, backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, overflow: "hidden", fontWeight: "900" },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  description: { color: colors.muted, marginTop: spacing.xs },
  subtext: { color: colors.text, marginTop: spacing.sm, fontWeight: "600" },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  memberRow: { gap: spacing.sm, paddingVertical: spacing.sm },
  memberCard: { width: 110, gap: spacing.xs, alignItems: "center", padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  memberName: { color: colors.text, fontWeight: "900", textAlign: "center" },
  memberHandle: { color: colors.muted, textAlign: "center" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoCard: { width: "48%", borderRadius: radii.md, overflow: "hidden", backgroundColor: colors.surface },
  photoImage: { width: "100%", aspectRatio: 4 / 3 },
  photoCaption: { color: colors.text, padding: spacing.sm },
  rideCardWrapper: { gap: spacing.sm },
  ridePhoto: { width: "100%", height: 180, borderRadius: radii.md, backgroundColor: colors.surfaceHigh }
});
