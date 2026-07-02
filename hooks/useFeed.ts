import { useEffect, useState } from "react";
import { rides as fallbackRides, routes as fallbackRoutes } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride, RoutePlan } from "@/lib/types";

export function useFeed() {
  const [rides, setRides] = useState<Ride[]>(fallbackRides);
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

  return { rides, sharedRoutes, loading };
}
