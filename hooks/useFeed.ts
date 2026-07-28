import { useEffect, useState } from "react";
import { rides as fallbackRides, routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride, RoutePlan } from "@/lib/types";

let demoRides = [...fallbackRides];

export function addDemoRide(ride: Ride) {
  demoRides = [ride, ...demoRides];
}

export function useFeed() {
  const [rides, setRides] = useState<Ride[]>(demoRides);
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
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (mounted && data) {
        setRides(data as Ride[]);
      }
      if (mounted) {
        setLoading(false);
      }
    }

    async function loadRoutes() {
      const { data } = await supabase
        .from("routes")
        .select("*")
        .eq("is_shared", true)
        .order("updated_at", { ascending: false });

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

  async function deleteRide(rideId: string) {
    const previousRides = rides;
    setRides((current) => current.filter((ride) => ride.id !== rideId));
    if (!hasSupabaseConfig) {
      demoRides = demoRides.filter((ride) => ride.id !== rideId);
      return true;
    }

    const { error } = await supabase.from("rides").delete().eq("id", rideId);
    if (error) {
      setRides(previousRides);
      return false;
    }
    return true;
  }

  async function reactToRide(rideId: string) {
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) return false;
    const likeCount = (ride.like_count ?? 0) + 1;
    setRides((current) => current.map((item) => item.id === rideId ? { ...item, like_count: likeCount } : item));
    if (hasSupabaseConfig) {
      const { error } = await supabase.from("rides").update({ like_count: likeCount }).eq("id", rideId);
      if (error) return false;
    } else {
      demoRides = demoRides.map((item) => item.id === rideId ? { ...item, like_count: likeCount } : item);
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
