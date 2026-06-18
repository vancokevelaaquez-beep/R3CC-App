import { useEffect, useMemo, useState } from "react";
import { notifications as fallbackNotifications } from "@/lib/mockData";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Notification } from "@/lib/types";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>(fallbackNotifications);

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) {
      return;
    }

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => data && setNotifications(data as Notification[]));

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((current) => [payload.new as Notification, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    if (hasSupabaseConfig && userId) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  return { notifications, unreadCount, markAllRead };
}
