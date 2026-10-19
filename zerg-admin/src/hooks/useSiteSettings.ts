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
  // Aviso del backend cuando falta aplicar la migración (se muestran los valores por defecto)
  const [setupMessage, setSetupMessage] = useState("");
  // Motivo legible cuando no se pudo cargar nada
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .get<{ data: SiteSettings; setupRequired?: boolean; message?: string }>("/settings")
      .then((res) => {
        setSaved(res.data.data);
        setDraft(res.data.data);
        if (res.data.setupRequired) setSetupMessage(res.data.message ?? "");
        setStatus("ready");
      })
      .catch((err) => {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        const base = api.defaults.baseURL;
        setLoadError(
          !response
            ? `No hay conexión con el backend (${base}). Revisa que esté encendido con \`pnpm dev\` en zerg-backend.`
            : response.status === 404
              ? "El backend no tiene la ruta /api/settings: está corriendo una versión anterior. Haz git pull y reinícialo."
              : response.data?.message ?? `El backend respondió con error ${response.status}.`
        );
        setStatus("error");
      });
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

  return { draft, status, error, savedAt, setupMessage, loadError, update, save, discard, isDirty };
}
