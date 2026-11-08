"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useLiveVersion } from "@/lib/live";
import type { GuideSummary, HelpPage } from "@/lib/help-pages";

type State<T> = { data: T | null; error: "not-found" | "error" | null; path: string };

// Pide a la API y se actualiza en vivo cuando el admin edita las páginas.
function useHelpData<T>(path: string | null) {
  const version = useLiveVersion("pages");
  const [state, setState] = useState<State<T>>({ data: null, error: null, path: "" });

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api
      .get<{ data: T }>(path)
      .then((res) => !cancelled && setState({ data: res.data.data, error: null, path }))
      .catch((err) => !cancelled && setState({ data: null, error: err?.response?.status === 404 ? "not-found" : "error", path }));
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  // Al cambiar de página no se muestra la anterior mientras carga la nueva
  return state.path === path ? state : { data: null, error: null, path: path ?? "" };
}

export const useHelpPage = (slug: string | undefined) => useHelpData<HelpPage>(slug ? `/pages/${encodeURIComponent(slug)}` : null);
export const useGuides = () => useHelpData<GuideSummary[]>("/pages/guias");
