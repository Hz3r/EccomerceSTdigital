"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { loginHref } from "@/lib/auth-redirect";

interface FavoritesContextType {
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string, nombre?: string) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType>({ isFavorite: () => false, toggle: () => {}, count: 0 });

// Favoritos guardados en la cuenta (se ven en cualquier dispositivo). Sin sesión, invita a ingresar.
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || USE_MOCKS) return;
    let cancelled = false;
    api
      .get<{ data: string[] }>("/favorites/ids")
      .then((res) => !cancelled && setIds(new Set(res.data.data)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    (productId: string, nombre?: string) => {
      if (!user) {
        toast.info("Ingresa para guardar favoritos", "Así los verás desde cualquier dispositivo.");
        router.push(loginHref(pathname));
        return;
      }
      const adding = !ids.has(productId);
      const apply = (add: boolean) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (add) next.add(productId);
          else next.delete(productId);
          return next;
        });
      apply(adding);
      if (adding) toast.success("Guardado en favoritos", nombre ? `${nombre} está en Mi cuenta → Favoritos.` : undefined);
      (adding ? api.post(`/favorites/${productId}`) : api.delete(`/favorites/${productId}`)).catch(() => {
        apply(!adding);
        toast.info("No se pudo actualizar tus favoritos", "Intenta de nuevo.");
      });
    },
    [user, ids, router, pathname]
  );

  const value = useMemo(
    () => ({ isFavorite: (id: string) => Boolean(user) && ids.has(id), toggle, count: user ? ids.size : 0 }),
    [ids, toggle, user]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
