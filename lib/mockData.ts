import { GroupRide, Notification, Ride, RoutePlan } from "./types";

export const sampleRoute = [
  { latitude: 14.5995, longitude: 120.9842, timestamp: Date.now() - 600000 },
  { latitude: 14.6042, longitude: 120.9911, timestamp: Date.now() - 420000 },
  { latitude: 14.6115, longitude: 120.9958, timestamp: Date.now() - 240000 },
  { latitude: 14.619, longitude: 121.001, timestamp: Date.now() }
];

export const rides: Ride[] = [
  {
    id: "ride-1",
    user_id: "member-1",
    title: "Dawn tempo loop",
    distance_km: 42.7,
    duration_sec: 5480,
    avg_speed: 28.1,
    top_speed: 54.4,
    elevation_m: 420,
    route_coords: sampleRoute,
    caption: "Early roll, clean legs. #r3cc #cycling",
    created_at: new Date().toISOString(),
    profile: { full_name: "Ari Santos", username: "arisprints", avatar_url: null },
    like_count: 28,
    comment_count: 6,
    photos: []
  },
  {
    id: "ride-2",
    user_id: "member-2",
    title: "Climb repeats",
    distance_km: 31.2,
    duration_sec: 4920,
    avg_speed: 22.8,
    top_speed: 61.2,
    elevation_m: 760,
    route_coords: sampleRoute.slice().reverse(),
    caption: "Pain cave, premium edition.",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    profile: { full_name: "Mika Reyes", username: "mikaclimbs", avatar_url: null },
    like_count: 41,
    comment_count: 9,
    photos: []
  }
];

export const routes: RoutePlan[] = [
  {
    id: "route-1",
    title: "R3CC City Heat",
    description: "Fast urban loop with sprint sections and cafe finish.",
    distance_km: 45,
    elevation_m: 380,
    difficulty: "medium",
    coords: sampleRoute,
    is_shared: true
  },
  {
    id: "route-2",
    title: "Ridge Breaker",
    description: "Short, steep, and made for climbers.",
    distance_km: 28,
    elevation_m: 820,
    difficulty: "hard",
    coords: sampleRoute.slice().reverse(),
    is_shared: true
  }
];

export const groupRides: GroupRide[] = [
  {
    id: "group-1",
    title: "Saturday Redline",
    description: "Members-only endurance pace with rotating pulls.",
    scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    distance_km: 68,
    meet_location: "R3CC Clubhouse",
    max_riders: 18,
    rsvp_count: 12
  }
];

export const notifications: Notification[] = [
  { id: "n1", type: "like", message: "Ari liked your ride", is_read: false, created_at: new Date().toISOString() },
  { id: "n2", type: "pr", message: "New personal record on City Heat", is_read: false, created_at: new Date().toISOString() },
  { id: "n3", type: "group_ride", message: "Saturday Redline was posted", is_read: true, created_at: new Date().toISOString() }
];
