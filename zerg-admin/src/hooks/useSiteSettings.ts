"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type { SiteSettings } from "@/types";

// Carga la configuración del sitio y guarda solo la sección que se edita.
export function useSiteSettings() {
  const [saved, setSaved] = useState<SiteSettings | null>(null);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ data: SiteSettings }>("/settings")
      .then((res) => {
        setSaved(res.data.data);
        setDraft(res.data.data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const update = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }, []);

  const save = useCallback(
    async (keys: (keyof SiteSettings)[]) => {
      if (!draft) return;
      setStatus("saving");
      setError("");
      try {
        const patch = Object.fromEntries(keys.map((k) => [k, draft[k]]));
        const res = await api.put<{ data: SiteSettings }>("/settings", patch);
        setSaved(res.data.data);
        setDraft(res.data.data);
        setSavedAt(new Date());
        setStatus("ready");
      } catch (err) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "No se pudo guardar");
        setStatus("ready");
      }
    },
    [draft]
  );

  const discard = useCallback(() => setDraft(saved), [saved]);
  const isDirty = (keys: (keyof SiteSettings)[]) =>
    Boolean(saved && draft && keys.some((k) => JSON.stringify(saved[k]) !== JSON.stringify(draft[k])));

  return { draft, status, error, savedAt, update, save, discard, isDirty };
}
