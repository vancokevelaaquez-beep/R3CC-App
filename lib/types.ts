export type Role = "admin" | "member";
export type ProfileStatus = "pending" | "approved" | "declined";
export type RidingLevel = "beginner" | "intermediate" | "advanced" | "elite";

export type Profile = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  role: Role;
  status: ProfileStatus;
  invite_code?: string | null;
  invite_quota: number;
  invites_used: number;
  bio?: string | null;
  riding_level?: RidingLevel | null;
  weekly_km?: string | null;
  instagram?: string | null;
  strava?: string | null;
  total_km: number;
  total_rides: number;
  streak_days: number;
  membership_paid?: boolean | null;
  membership_paid_at?: string | null;
};

export type LatLngPoint = {
  latitude: number;
  longitude: number;
  timestamp?: number;
  altitude?: number | null;
  speedMps?: number | null;
};

export type Ride = {
  id: string;
  user_id: string;
  title: string;
  distance_km: number;
  duration_sec: number;
  avg_speed: number;
  top_speed: number;
  elevation_m: number;
  route_coords: LatLngPoint[];
  caption?: string | null;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "username" | "avatar_url">;
  like_count?: number;
  reacted_by_me?: boolean;
  comment_count?: number;
  photos?: string[];
};

export type RoutePlan = {
  id: string;
  title: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  difficulty: "easy" | "medium" | "hard";
  coords: LatLngPoint[];
  is_shared: boolean;
  profile?: Pick<Profile, "full_name" | "username" | "avatar_url">;
};

export type GroupRide = {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  distance_km: number;
  meet_location: string;
  max_riders?: number | null;
  rsvp_count?: number;
};

export type Notification = {
  id: string;
  type: "like" | "comment" | "group_ride" | "approved" | "declined" | "invite_accepted" | "pr" | "streak";
  message: string;
  is_read: boolean;
  created_at: string;
};
