import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "sw_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = { u: string; exp: number };

export function sessionSecret() {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return secret;
}

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(
  username: string,
  secret = sessionSecret(),
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const payload: SessionPayload = { u: username, exp: nowSeconds + SESSION_TTL_SECONDS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  secret = sessionSecret(),
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(data, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (typeof payload.u !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= nowSeconds) return null;
    if (payload.u !== configuredUsername()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function configuredUsername() {
  return process.env.AUTH_USERNAME ?? "admin";
}

export function cookieSecure() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return process.env.NODE_ENV === "production";
}
