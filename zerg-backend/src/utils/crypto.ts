import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Cifrado de datos sensibles en la base (credenciales de los clientes) con AES-256-GCM.
// La clave sale de CREDENTIALS_KEY; si falta se deriva de JWT_SECRET (cambiar cualquiera vuelve ilegible lo guardado).

const VERSION = "v1";

function key() {
  const secret = process.env.CREDENTIALS_KEY?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("Falta CREDENTIALS_KEY (o JWT_SECRET) para cifrar las credenciales");
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decrypt(payload: string) {
  const [version, iv, tag, data] = payload.split(":");
  if (version !== VERSION || !iv || !tag || !data) throw new Error("Formato de dato cifrado no válido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
