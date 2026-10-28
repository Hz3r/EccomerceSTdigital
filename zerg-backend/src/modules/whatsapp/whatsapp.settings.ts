import { getPrisma } from "../../config/database.js";
import { BadRequestError } from "../../errors/appError.js";
import { decrypt, encrypt } from "../../utils/crypto.js";

// Conexión con WhatsApp Business editable desde el panel (Contenido del sitio → WhatsApp).
// Se guarda en site_settings con la clave "whatsapp" (la tienda solo lee la clave "site").
// El token, el App Secret y el verify token se guardan cifrados. Un campo vacío usa la variable
// WHATSAPP_* del .env, así una instalación configurada solo con el .env sigue funcionando.

const KEY = "whatsapp";

export const SECRET_FIELDS = ["token", "appSecret", "verifyToken"] as const;
export const TEXT_FIELDS = ["phoneNumberId", "version", "countryCode", "language", "templateReply", "templateCredentials"] as const;

type SecretField = (typeof SECRET_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];

export type PanelWhatsapp = { activo: boolean } & Partial<Record<SecretField | TextField, string>>;

export const ENV_NAMES: Record<SecretField | TextField, string> = {
  token: "WHATSAPP_TOKEN",
  appSecret: "WHATSAPP_APP_SECRET",
  verifyToken: "WHATSAPP_VERIFY_TOKEN",
  phoneNumberId: "WHATSAPP_PHONE_NUMBER_ID",
  version: "WHATSAPP_API_VERSION",
  countryCode: "WHATSAPP_COUNTRY_CODE",
  language: "WHATSAPP_TEMPLATE_LANGUAGE",
  templateReply: "WHATSAPP_TEMPLATE_REPLY",
  templateCredentials: "WHATSAPP_TEMPLATE_CREDENTIALS",
};

const MAX_LENGTH = 1000;

// Copia en memoria (descifrada) para que whatsappConfig() siga siendo síncrona.
let cache: PanelWhatsapp = { activo: true };
let loaded = false;

export const panelWhatsapp = (): PanelWhatsapp => cache;

/** Valor efectivo de un campo: el del panel o, si está vacío, el del .env. */
export function effective(field: SecretField | TextField) {
  return cache[field]?.trim() || process.env[ENV_NAMES[field]]?.trim() || "";
}

function decode(raw: unknown): PanelWhatsapp {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const result: PanelWhatsapp = { activo: value.activo !== false };
  for (const field of TEXT_FIELDS) {
    if (typeof value[field] === "string") result[field] = value[field];
  }
  for (const field of SECRET_FIELDS) {
    if (typeof value[field] !== "string" || !value[field]) continue;
    try {
      result[field] = decrypt(value[field]);
    } catch {
      // Cambió CREDENTIALS_KEY/JWT_SECRET: el dato ya no se puede leer y hay que volver a ingresarlo.
      console.error(`[whatsapp] No se pudo descifrar "${field}" guardado en el panel; vuelve a ingresarlo.`);
    }
  }
  return result;
}

function encode(config: PanelWhatsapp) {
  const value: Record<string, unknown> = { activo: config.activo };
  for (const field of TEXT_FIELDS) if (config[field]) value[field] = config[field];
  for (const field of SECRET_FIELDS) if (config[field]) value[field] = encrypt(config[field]!);
  return value;
}

export async function loadWhatsappSettings() {
  try {
    const row = await getPrisma().siteSetting.findUnique({ where: { key: KEY } });
    cache = decode(row?.value);
    loaded = true;
  } catch (err) {
    // Sin base de datos se usa solo el .env; se reintenta en la próxima operación.
    console.error("[whatsapp] No se pudo leer la configuración del panel:", (err as Error).message);
  }
}

export async function ensureWhatsappSettings() {
  if (!loaded) await loadWhatsappSettings();
}

/**
 * Cambios desde el panel. En los secretos: texto = reemplazar, null = borrar, ausente o "" = conservar
 * (el panel nunca recibe el valor guardado, así que un campo vacío significa "no lo toques").
 */
export async function updateWhatsappSettings(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new BadRequestError("Datos no válidos");
  const body = input as Record<string, unknown>;
  await ensureWhatsappSettings();
  const next: PanelWhatsapp = { ...cache };

  if ("activo" in body) {
    if (typeof body.activo !== "boolean") throw new BadRequestError("activo debe ser verdadero o falso");
    next.activo = body.activo;
  }
  for (const field of TEXT_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value !== null && typeof value !== "string") throw new BadRequestError(`${field} debe ser texto`);
    const text = (value ?? "").trim();
    if (text.length > MAX_LENGTH) throw new BadRequestError(`${field} es demasiado largo`);
    next[field] = text || undefined;
  }
  for (const field of SECRET_FIELDS) {
    const value = body[field];
    if (value === undefined || value === "") continue;
    if (value !== null && typeof value !== "string") throw new BadRequestError(`${field} debe ser texto`);
    const text = (value ?? "").trim();
    if (text.length > MAX_LENGTH) throw new BadRequestError(`${field} es demasiado largo`);
    next[field] = text || undefined;
  }
  if (next.phoneNumberId && !/^\d{5,30}$/.test(next.phoneNumberId)) {
    throw new BadRequestError("El Phone Number ID son solo números (lo ves en Meta → WhatsApp → Configuración de la API)");
  }
  if (next.countryCode && !/^\d{1,4}$/.test(next.countryCode.replace(/^\+/, ""))) {
    throw new BadRequestError("El código de país son de 1 a 4 números (51 para Perú)");
  }
  if (next.countryCode) next.countryCode = next.countryCode.replace(/^\+/, "");

  const value = encode(next);
  await getPrisma().siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: value as object }, update: { value: value as object } });
  cache = next;
  loaded = true;
}

/** Para pruebas. */
export function resetWhatsappSettingsCache(next: PanelWhatsapp = { activo: true }) {
  cache = next;
  loaded = true;
}
