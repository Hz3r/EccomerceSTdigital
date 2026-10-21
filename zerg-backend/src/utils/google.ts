import { createPublicKey, type JsonWebKeyInput, type KeyObject } from "crypto";
import jwt from "jsonwebtoken";
import { AppError, UnauthorizedError } from "../errors/appError.js";

// Inicio de sesión con Google (Google Identity Services): la tienda recibe un "ID token"
// firmado por Google y aquí se verifica la firma con las claves públicas de Google.
const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"] as [string, ...string[]];

export interface GoogleProfile {
  googleId: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
}

export const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() ?? "";

let cache: { keys: Map<string, KeyObject>; expiresAt: number } | null = null;

// Claves públicas de Google, guardadas en memoria el tiempo que indica su Cache-Control.
async function getKeys(forceRefresh = false): Promise<Map<string, KeyObject>> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) return cache.keys;

  const res = await fetch(CERTS_URL).catch(() => null);
  if (!res?.ok) throw new AppError("No se pudo contactar con Google, intenta de nuevo", 503);
  const body = (await res.json()) as { keys: (JsonWebKeyInput["key"] & { kid: string })[] };

  const keys = new Map(body.keys.map((jwk) => [jwk.kid, createPublicKey({ key: jwk, format: "jwk" })]));
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  cache = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new AppError("El inicio de sesión con Google no está configurado", 503);

  const kid = jwt.decode(idToken, { complete: true })?.header.kid;
  if (!kid) throw new UnauthorizedError("Token de Google inválido");

  // Google rota sus claves: si el kid no está en caché, se vuelve a pedir la lista.
  let key = (await getKeys()).get(kid);
  if (!key) key = (await getKeys(true)).get(kid);
  if (!key) throw new UnauthorizedError("Token de Google inválido");

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, key, { algorithms: ["RS256"], audience: clientId, issuer: ISSUERS }) as jwt.JwtPayload;
  } catch {
    throw new UnauthorizedError("Token de Google inválido o expirado");
  }

  if (!payload.sub || typeof payload.email !== "string" || payload.email_verified !== true) {
    throw new UnauthorizedError("Tu cuenta de Google no tiene un correo verificado");
  }

  const email = payload.email.toLowerCase();
  return {
    googleId: payload.sub,
    email,
    nombre: (typeof payload.name === "string" && payload.name.trim()) || email.split("@")[0]!,
    avatarUrl: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
