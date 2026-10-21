// Adónde volver después de ingresar. Solo rutas internas ("/checkout"), nunca otro dominio.
export function safeRedirect(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function loginHref(redirect: string) {
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

// Mensaje legible de un error de la API (el backend responde { message }).
export function apiErrorMessage(err: unknown, fallback: string) {
  const e = err as { isAxiosError?: boolean; code?: string; response?: { data?: { message?: string } } } | null;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === "ERR_NETWORK") return "No hay conexión con el servidor. Intenta de nuevo en unos segundos.";
  if (e?.isAxiosError) return fallback;
  return err instanceof Error && err.message ? err.message : fallback;
}
