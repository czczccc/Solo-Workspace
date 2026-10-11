import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { lockRemaining, recordFailure, recordSuccess, resetRateLimits, MAX_FAILURES } from "@/lib/auth/rate-limit";
import { createSessionToken, SESSION_TTL_SECONDS, verifySessionToken } from "@/lib/auth/session";

const SECRET = "x".repeat(40);

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("a", "")).toBe(false);
    expect(await verifyPassword("a", "bcrypt$1$2$3$4$5")).toBe(false);
  });
});

describe("session tokens", () => {
  beforeEach(() => {
    process.env.AUTH_USERNAME = "jay";
  });

  it("round-trips a valid token", () => {
    const token = createSessionToken("jay", SECRET, 1000);
    expect(verifySessionToken(token, SECRET, 1001)?.u).toBe("jay");
  });

  it("rejects expired, tampered, foreign-secret and wrong-user tokens", () => {
    const token = createSessionToken("jay", SECRET, 1000);
    expect(verifySessionToken(token, SECRET, 1000 + SESSION_TTL_SECONDS)).toBeNull();
    const [data, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "jay", exp: 9e12 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, SECRET, 1001)).toBeNull();
    expect(verifySessionToken(`${data}.${sig}x`, SECRET, 1001)).toBeNull();
    expect(verifySessionToken(token, "y".repeat(40), 1001)).toBeNull();
    expect(verifySessionToken(createSessionToken("eve", SECRET, 1000), SECRET, 1001)).toBeNull();
    expect(verifySessionToken("garbage", SECRET, 1001)).toBeNull();
  });
});

describe("login rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("locks a key after repeated failures and clears on success", () => {
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure("ip", 0);
    expect(lockRemaining("ip", 0)).toBe(0);
    recordFailure("ip", 0);
    expect(lockRemaining("ip", 0)).toBeGreaterThan(0);
    recordSuccess("ip");
    expect(lockRemaining("ip", 0)).toBe(0);
  });
});
