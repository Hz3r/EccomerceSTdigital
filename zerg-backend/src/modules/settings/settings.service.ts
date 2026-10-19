import type { Prisma } from "@prisma/client";
import { getPrisma } from "../../config/database.js";
import { AppError, BadRequestError } from "../../errors/appError.js";
import { defaultSettings, type SiteSettings } from "./settings.defaults.js";

const SETTINGS_KEY = "site";
const MAX_STRING = 500;
const MAX_ITEMS = 60;

type Shape = string | number | boolean | Shape[] | { [key: string]: Shape };

// Toma de `input` solo las claves que existen en `shape` y con el mismo tipo.
// Lo desconocido o con tipo incorrecto se descarta y se usa el valor por defecto.
export function sanitize<T extends Shape>(shape: T, input: unknown): T {
  if (Array.isArray(shape)) {
    if (!Array.isArray(input)) return shape;
    return input
      .filter((v) => typeof v === "string")
      .map((v: string) => v.trim().slice(0, MAX_STRING))
      .filter(Boolean)
      .slice(0, MAX_ITEMS) as T;
  }
  if (typeof shape === "object" && shape !== null) {
    const source = typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const result: Record<string, Shape> = {};
    for (const [key, value] of Object.entries(shape)) {
      result[key] = sanitize(value, source[key]);
    }
    return result as T;
  }
  if (typeof shape === "string") return (typeof input === "string" ? input.trim().slice(0, MAX_STRING) : shape) as T;
  if (typeof shape === "boolean") return (typeof input === "boolean" ? input : shape) as T;
  if (typeof shape === "number") return (typeof input === "number" && Number.isFinite(input) ? input : shape) as T;
  return shape;
}

export const SETUP_MESSAGE =
  "Falta preparar la base de datos para el contenido del sitio. En zerg-backend ejecuta " +
  "`npx prisma migrate deploy` y `npx prisma generate`, y reinicia el backend.";

// La tabla no existe (migración sin aplicar) o el cliente de Prisma no se regeneró tras actualizar.
function isSetupError(err: unknown) {
  const code = (err as { code?: string })?.code;
  return code === "P2021" || code === "P2022" || (err instanceof TypeError && /siteSetting|findUnique|upsert|deleteMany/.test(err.message));
}

let warned = false;

/** Contenido actual. Si la base aún no está preparada, devuelve los valores por defecto con un aviso. */
export const getWithStatus = async (): Promise<{ settings: SiteSettings; setupRequired: boolean }> => {
  try {
    const row = await getPrisma().siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
    return { settings: sanitize(defaultSettings as unknown as Shape, row?.value) as unknown as SiteSettings, setupRequired: false };
  } catch (err) {
    if (!isSetupError(err)) throw err;
    if (!warned) {
      console.warn(`[settings] ${SETUP_MESSAGE}`);
      warned = true;
    }
    return { settings: defaultSettings, setupRequired: true };
  }
};

export const get = async (): Promise<SiteSettings> => (await getWithStatus()).settings;

function rethrowSetup(err: unknown): never {
  if (isSetupError(err)) throw new AppError(SETUP_MESSAGE, 503);
  throw err;
}

export const update = async (input: unknown): Promise<SiteSettings> => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new BadRequestError("La configuración debe ser un objeto");
  }
  // Se parte de lo guardado para permitir actualizaciones parciales (una sola sección).
  const current = await get();
  const merged = deepMerge(current as unknown as Record<string, unknown>, input as Record<string, unknown>);
  const value = sanitize(defaultSettings as unknown as Shape, merged) as unknown as SiteSettings;

  await getPrisma()
    .siteSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: value as unknown as Prisma.InputJsonValue },
      create: { key: SETTINGS_KEY, value: value as unknown as Prisma.InputJsonValue },
    })
    .catch(rethrowSetup);
  return value;
};

export const reset = async (): Promise<SiteSettings> => {
  await getPrisma().siteSetting.deleteMany({ where: { key: SETTINGS_KEY } }).catch(rethrowSetup);
  return defaultSettings;
};

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const prev = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && prev && typeof prev === "object" && !Array.isArray(prev)
        ? deepMerge(prev as Record<string, unknown>, value as Record<string, unknown>)
        : value;
  }
  return out;
}
