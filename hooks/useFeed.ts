import { useEffect, useState } from "react";
import { rides as fallbackRides } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Ride } from "@/lib/types";

export function useFeed() {
  const [rides, setRides] = useState<Ride[]>(fallbackRides);
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
        .order("created_at", { ascending: false });

      if (mounted && data) {
        setRides(data as Ride[]);
      }
      if (mounted) {
        setLoading(false);
      }
    }

    loadRides();

    const channel = supabase
      .channel("rides-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, loadRides)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { rides, loading };
}
