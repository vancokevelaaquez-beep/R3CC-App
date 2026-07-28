import { useEffect, useState } from "react";
import { rides as fallbackRides, routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride, RoutePlan } from "@/lib/types";

let demoRides = [...fallbackRides];

export function addDemoRide(ride: Ride) {
  demoRides = [ride, ...demoRides];
}

export function getDemoSavedRides(userId?: string) {
  return demoRides.filter((ride) => !ride.is_public && (!userId || ride.user_id === userId));
}

export function useFeed() {
  const [rides, setRides] = useState<Ride[]>(demoRides.filter((ride) => ride.is_public !== false));
  const [sharedRoutes, setSharedRoutes] = useState<RoutePlan[]>(fallbackRoutes.filter((route) => route.is_shared));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    let mounted = true;

  async function loadRides() {
      setLoading(true);
      const { data } = await supabase
        .from("rides")
        .select("*, profiles(full_name, username, avatar_url), ride_photos(photo_url)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (mounted && data) {
        const { data: { user } } = await supabase.auth.getUser();
        const rideIds = data.map((ride) => ride.id);
        const { data: likes } = rideIds.length
          ? await supabase.from("likes").select("ride_id, user_id").in("ride_id", rideIds)
          : { data: [] };
        const likeCounts = new Map<string, number>();
        const reactedRideIds = new Set<string>();
        (likes ?? []).forEach((like) => {
          likeCounts.set(like.ride_id, (likeCounts.get(like.ride_id) ?? 0) + 1);
          if (like.user_id === user?.id) reactedRideIds.add(like.ride_id);
        });
        setRides((data as (Ride & { ride_photos?: { photo_url: string }[] })[]).map(({ ride_photos, ...ride }) => ({
          ...ride,
          photos: ride_photos?.map((photo) => photo.photo_url) ?? [],
          like_count: likeCounts.get(ride.id) ?? 0,
          reacted_by_me: reactedRideIds.has(ride.id)
        })));
      }
      if (mounted) {
        setLoading(false);
      }
    }

    async function loadRoutes() {
      const { data } = await supabase
        .from("routes")
        .select("*, profiles!routes_created_by_fkey(full_name, username, avatar_url)")
        .eq("is_shared", true)
        .order("created_at", { ascending: false });

      if (mounted && data) {
        setSharedRoutes(data as RoutePlan[]);
      }
    }

    loadRides();
    loadRoutes();

    const ridesChannel = supabase
      .channel("rides-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, loadRides)
      .subscribe();

    const routesChannel = supabase
      .channel("routes-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "routes" }, loadRoutes)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(routesChannel);
    };
  }, []);

  async function updateRide(rideId: string, updates: Partial<Pick<Ride, "caption" | "photos">>) {
    const previousRides = rides;
    setRides((current) => current.map((ride) => ride.id === rideId ? { ...ride, ...updates } : ride));
    if (!hasSupabaseConfig) {
      demoRides = demoRides.map((ride) => ride.id === rideId ? { ...ride, ...updates } : ride);
      return true;
    }

    const { error } = await supabase.from("rides").update(updates).eq("id", rideId);
    if (error) {
      setRides(previousRides);
      return false;
    }
    return true;
  }

  async function deleteRide(rideId: string): Promise<{ ok: boolean; error?: string }> {
    const previousRides = rides;
    setRides((current) => current.filter((ride) => ride.id !== rideId));
    if (!hasSupabaseConfig) {
      demoRides = demoRides.filter((ride) => ride.id !== rideId);
      return { ok: true };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRides(previousRides);
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    const { data, error } = await supabase
      .from("rides")
      .delete()
      .eq("id", rideId)
      .eq("user_id", user.id)
      .select("id");
    if (error) {
      setRides(previousRides);
      return { ok: false, error: error.message };
    }
    if (!data) {
      setRides(previousRides);
      return { ok: false, error: "Only the rider who created this post can delete it." };
    }
    return { ok: true };
  }

  async function reactToRide(rideId: string) {
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) return false;
    const wasReacted = Boolean(ride.reacted_by_me);
    const likeCount = Math.max(0, (ride.like_count ?? 0) + (wasReacted ? -1 : 1));
    const previousRides = rides;
    setRides((current) => current.map((item) => item.id === rideId ? { ...item, like_count: likeCount, reacted_by_me: !wasReacted } : item));
    if (hasSupabaseConfig) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRides(previousRides);
        return false;
      }
      const { error } = wasReacted
        ? await supabase.from("likes").delete().eq("ride_id", rideId).eq("user_id", user.id)
        : await supabase.from("likes").insert({ ride_id: rideId, user_id: user.id });
      if (error) {
        setRides(previousRides);
        return false;
      }
    } else {
      demoRides = demoRides.map((item) => item.id === rideId ? { ...item, like_count: likeCount, reacted_by_me: !wasReacted } : item);
    }
    return true;
  }

  async function commentOnRide(rideId: string) {
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) return false;
    const commentCount = (ride.comment_count ?? 0) + 1;
    setRides((current) => current.map((item) => item.id === rideId ? { ...item, comment_count: commentCount } : item));
    if (hasSupabaseConfig) {
      const { error } = await supabase.from("rides").update({ comment_count: commentCount }).eq("id", rideId);
      if (error) return false;
    } else {
      demoRides = demoRides.map((item) => item.id === rideId ? { ...item, comment_count: commentCount } : item);
    }
    return true;
  }

  return { rides, sharedRoutes, loading, updateRide, deleteRide, reactToRide, commentOnRide };
}
