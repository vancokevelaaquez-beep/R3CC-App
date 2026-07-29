import { useEffect, useState } from "react";
import { rides as fallbackRides, routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride, RoutePlan } from "@/lib/types";

const PAGE_SIZE = 6;
let demoRides = [...fallbackRides];

export function addDemoRide(ride: Ride) {
  demoRides = [ride, ...demoRides];
}

export function getDemoSavedRides(userId?: string) {
  return demoRides.filter((ride) => !ride.is_public && (!userId || ride.user_id === userId));
}

function hydrateFeeds(rawRides: any[], userId?: string): Ride[] {
  const rideIds = rawRides.map((ride) => ride.id);
  return rawRides.map((ride) => ({
    ...ride,
    profile: ride.profiles,
    photos: ride.ride_photos?.map((photo: any) => photo.photo_url) ?? [],
    like_count: 0,
    reacted_by_me: false,
    comment_count: ride.comment_count ?? 0
  }));
}

export function useFeed() {
  const demoPublicRides = demoRides.filter((ride) => ride.is_public !== false);
  const [rides, setRides] = useState<Ride[]>(demoPublicRides.slice(0, PAGE_SIZE));
  const [sharedRoutes, setSharedRoutes] = useState<RoutePlan[]>(fallbackRoutes.filter((route) => route.is_shared));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(demoPublicRides.length > PAGE_SIZE);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    let mounted = true;

    async function fetchRides(pageIndex = 0) {
      if (pageIndex === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const start = pageIndex * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;

        const { data } = await supabase
          .from("rides")
          .select("*, profiles(full_name, username, avatar_url), ride_photos(photo_url)")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .range(start, end);

        if (!mounted || !data) {
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        const rideIds = data.map((ride) => ride.id);

        const { data: likeData } = rideIds.length
          ? await supabase.from("likes").select("ride_id, user_id").in("ride_id", rideIds)
          : { data: [] };

        const likeCounts = new Map<string, number>();
        const reactedRideIds = new Set<string>();

        (likeData ?? []).forEach((like) => {
          likeCounts.set(like.ride_id, (likeCounts.get(like.ride_id) ?? 0) + 1);
          if (like.user_id === userId) {
            reactedRideIds.add(like.ride_id);
          }
        });

        const pageRides = (data as any[]).map((ride) => ({
          ...ride,
          profile: ride.profiles,
          photos: ride.ride_photos?.map((photo: any) => photo.photo_url) ?? [],
          like_count: likeCounts.get(ride.id) ?? 0,
          reacted_by_me: reactedRideIds.has(ride.id),
          comment_count: ride.comment_count ?? 0
        })) as Ride[];

        setRides((current) => (pageIndex === 0 ? pageRides : [...current, ...pageRides]));
        setPage(pageIndex);
        setHasMore(pageRides.length === PAGE_SIZE);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load feed.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
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

    fetchRides(0);
    loadRoutes();

    const ridesChannel = supabase
      .channel("rides-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => fetchRides(0))
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

  async function refreshFeed() {
    if (hasSupabaseConfig) {
      setRefreshing(true);
      await fetchRides(0);
      return;
    }

    const demoPublicRides = demoRides.filter((ride) => ride.is_public !== false);
    setRides(demoPublicRides.slice(0, PAGE_SIZE));
    setPage(0);
    setHasMore(demoPublicRides.length > PAGE_SIZE);
  }

  async function loadMore() {
    if (loadingMore || loading || !hasMore) {
      return;
    }

    if (!hasSupabaseConfig) {
      const demoPublicRides = demoRides.filter((ride) => ride.is_public !== false);
      const nextPage = page + 1;
      const nextRides = demoPublicRides.slice(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE);
      setRides((current) => [...current, ...nextRides]);
      setPage(nextPage);
      setHasMore(nextRides.length === PAGE_SIZE);
      return;
    }

    setLoadingMore(true);
    await fetchRides(page + 1);
  }

  async function updateRide(rideId: string, updates: Partial<Pick<Ride, "caption" | "photos">>) {
    const previousRides = rides;
    setRides((current) => current.map((ride) => (ride.id === rideId ? { ...ride, ...updates } : ride)));
    if (!hasSupabaseConfig) {
      demoRides = demoRides.map((ride) => (ride.id === rideId ? { ...ride, ...updates } : ride));
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
    if (error || !data) {
      setRides(previousRides);
      return { ok: false, error: error?.message ?? "Only the rider who created this post can delete it." };
    }
    return { ok: true };
  }

  async function reactToRide(rideId: string) {
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) return false;
    const wasReacted = Boolean(ride.reacted_by_me);
    const likeCount = Math.max(0, (ride.like_count ?? 0) + (wasReacted ? -1 : 1));
    const previousRides = rides;
    setRides((current) => current.map((item) => (item.id === rideId ? { ...item, like_count: likeCount, reacted_by_me: !wasReacted } : item)));
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
      demoRides = demoRides.map((item) => (item.id === rideId ? { ...item, like_count: likeCount, reacted_by_me: !wasReacted } : item));
    }
    return true;
  }

  async function commentOnRide(rideId: string) {
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) return false;
    const commentCount = (ride.comment_count ?? 0) + 1;
    const previousRides = rides;
    setRides((current) => current.map((item) => (item.id === rideId ? { ...item, comment_count: commentCount } : item)));
    if (hasSupabaseConfig) {
      const { error } = await supabase.from("rides").update({ comment_count: commentCount }).eq("id", rideId);
      if (error) {
        setRides(previousRides);
        return false;
      }
    } else {
      demoRides = demoRides.map((item) => (item.id === rideId ? { ...item, comment_count: commentCount } : item));
    }
    return true;
  }

  return {
    rides,
    sharedRoutes,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    refreshFeed,
    loadMore,
    updateRide,
    deleteRide,
    reactToRide,
    commentOnRide
  };
}

