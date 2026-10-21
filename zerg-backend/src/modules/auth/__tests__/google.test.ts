import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { generateKeyPairSync } from "crypto";
import jwt from "jsonwebtoken";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockUser } from "../../../test/fixtures/index.js";
import { verifyGoogleIdToken } from "../../../utils/google.js";
import * as authService from "../auth.service.js";

const CLIENT_ID = "test-client.apps.googleusercontent.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-kid", alg: "RS256", use: "sig" };

const googleToken = (claims: Record<string, unknown> = {}, options: jwt.SignOptions = {}) =>
  jwt.sign(
    { sub: "google-123", email: "Ana@Gmail.com", email_verified: true, name: "Ana Pérez", picture: "https://lh3.googleusercontent.com/a", ...claims },
    privateKey,
    { algorithm: "RS256", keyid: "test-kid", audience: CLIENT_ID, issuer: "https://accounts.google.com", expiresIn: "1h", ...options }
  );

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { "cache-control": "public, max-age=3600" } }))
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("verifyGoogleIdToken", () => {
  it("acepta un token válido y devuelve el perfil", async () => {
    await expect(verifyGoogleIdToken(googleToken())).resolves.toEqual({
      googleId: "google-123",
      email: "ana@gmail.com",
      nombre: "Ana Pérez",
      avatarUrl: "https://lh3.googleusercontent.com/a",
    });
  });

  it("rechaza tokens emitidos para otra aplicación", async () => {
    await expect(verifyGoogleIdToken(googleToken({}, { audience: "otra-app" }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rechaza tokens firmados con otra clave", async () => {
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const forged = jwt.sign({ sub: "x", email: "x@x.com", email_verified: true }, other, {
      algorithm: "RS256", keyid: "test-kid", audience: CLIENT_ID, issuer: "accounts.google.com",
    });
    await expect(verifyGoogleIdToken(forged)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rechaza correos sin verificar", async () => {
    await expect(verifyGoogleIdToken(googleToken({ email_verified: false }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("responde 503 si no se puede contactar con Google", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(verifyGoogleIdToken(googleToken({}, { keyid: "otra-clave" }))).rejects.toMatchObject({ statusCode: 503 });
  });

  it("responde 503 si Google no está configurado", async () => {
    process.env.GOOGLE_CLIENT_ID = "";
    await expect(verifyGoogleIdToken(googleToken())).rejects.toMatchObject({ statusCode: 503 });
  });
});

describe("authService.google", () => {
  it("crea una cuenta nueva si el correo no existe", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...mockUser, id: "new-id", passwordHash: null, ...data,
    }));

    const result = await authService.google(googleToken());

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "ana@gmail.com", googleId: "google-123", proveedor: "GOOGLE", nombre: "Ana Pérez" }),
    });
    expect(result.user.email).toBe("ana@gmail.com");
    expect(result.token).toEqual(expect.any(String));
    expect(result.status).toBe("created");
  });

  it("vincula Google a una cuenta existente con el mismo correo", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...mockUser, email: "ana@gmail.com" });
    mockPrisma.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...mockUser, ...data }));

    const result = await authService.google(googleToken());

    expect(result.status).toBe("linked");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: expect.objectContaining({ googleId: "google-123" }),
    });
  });

  it("indica cuando la cuenta ya existía con Google", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, googleId: "google-123" });
    mockPrisma.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...mockUser, ...data }));

    const result = await authService.google(googleToken());

    expect(result.status).toBe("existing");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("no deja entrar a una cuenta desactivada", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, googleId: "google-123", isActive: false });
    await expect(authService.google(googleToken())).rejects.toMatchObject({ statusCode: 401 });
  });

  it("el login con contraseña indica usar Google en cuentas creadas con Google", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null, googleId: "google-123" });
    await expect(authService.login({ email: "test@test.com", password: "x" })).rejects.toThrow(/Google/);
  });

  it("el registro con correo existente indica cómo entrar", async () => {
    const dto = { nombre: "Ana", email: "test@test.com", password: "secreto123" };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    await expect(authService.register(dto)).rejects.toMatchObject({ statusCode: 409, message: expect.stringMatching(/Inicia sesión/) });

    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null, googleId: "google-123" });
    await expect(authService.register(dto)).rejects.toThrow(/Continuar con Google/);
  });
});
