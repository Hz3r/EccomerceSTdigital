"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safeRedirect } from "@/lib/auth-redirect";

// Para /login y /register: adónde volver al terminar (?redirect=) y salida automática si ya hay sesión.
export function useAuthRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const redirect = safeRedirect(useSearchParams().get("redirect"));
  const isCheckout = redirect.startsWith("/checkout");

  useEffect(() => {
    if (!isLoading && user) router.replace(redirect);
  }, [isLoading, user, redirect, router]);

  return { redirect, isCheckout, done: () => router.replace(redirect) };
}
