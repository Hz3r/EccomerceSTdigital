"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useLiveVersion } from "@/lib/live";

// Chats con mensajes sin leer (contador del menú "Mensajes"), en vivo.
export function useChatUnread() {
  const [unread, setUnread] = useState(0);
  const version = useLiveVersion("support");

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: { unread: number } }>("/support/admin/conversations", { params: { estado: "ABIERTA" } })
      .then((res) => !cancelled && setUnread(res.data.data.unread))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version]);

  return unread;
}
