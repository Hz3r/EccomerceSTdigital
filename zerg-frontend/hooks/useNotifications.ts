"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { useLiveVersion } from "@/lib/live";
import { useAuth } from "@/hooks/useAuth";
import type { AppNotification, NotificationList } from "@/types";

// Notificaciones del cliente con sesión (avance de sus pedidos y reseñas). Se actualizan en vivo.
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const version = useLiveVersion("notifications", "orders", "reviews");

  const enabled = Boolean(user) && !USE_MOCKS;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    api
      .get<{ data: NotificationList }>("/notifications", { params: { limit: 20 } })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data.items);
        setUnread(res.data.data.unread);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, version, user?.id]);

  const markRead = useCallback((id: string) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((list) => list.map((n) => ({ ...n, leida: true })));
    setUnread(0);
    api.post("/notifications/read-all").catch(() => {});
  }, []);

  return { enabled, items: enabled ? items : [], unread: enabled ? unread : 0, markRead, markAllRead };
}
