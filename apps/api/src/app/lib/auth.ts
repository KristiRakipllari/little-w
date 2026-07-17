import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { queryOne } from "@calm-stories/db";
import type { User } from "@calm-stories/shared";

// The dev fallback must never sign production tokens — anyone who reads the
// source could forge an admin JWT. Fail fast instead.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "7d") as jwt.SignOptions["expiresIn"];

// ─── Password hashing ────────────────────────
// bcrypt (salted, deliberately slow). Hashes created before the switch are
// unsalted SHA-256; verifyPassword still accepts those, and the login route
// transparently re-hashes them with bcrypt on the next successful login.

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Pre-bcrypt hashes are bare SHA-256 hex; bcrypt hashes start with "$2". */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith("$2");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (isLegacyHash(hash)) {
    const candidate = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    return (
      candidate.length === hash.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash))
    );
  }
  return bcrypt.compare(password, hash);
}

// ─── JWT tokens ──────────────────────────────

export function signToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

// ─── Request auth extraction ─────────────────

export async function getAuthUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload?.id) return null;

  const user = await queryOne<User>(
    `SELECT id, email, name, role, trial_used,
            entitlement, entitlement_expires_at, entitlement_store,
            created_at, updated_at
     FROM users WHERE id = $1`,
    [payload.id]
  );

  return user;
}

// ─── Entitlements ────────────────────────────

/**
 * True while the user's server-side entitlement (synced by the RevenueCat
 * webhook) is active. A null expiry means non-expiring (e.g. promotional).
 */
export function hasActiveEntitlement(user: User | null): boolean {
  if (!user?.entitlement) return false;
  if (!user.entitlement_expires_at) return true;
  return new Date(user.entitlement_expires_at).getTime() > Date.now();
}

// ─── Auth guard ──────────────────────────────

export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<User> {
  const user = await requireAuth(req);
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}

/** Content management: admins and editors, but never parent accounts. */
export async function requireStaff(req: NextRequest): Promise<User> {
  const user = await requireAuth(req);
  if (user.role !== "admin" && user.role !== "editor") {
    throw new Error("Forbidden: staff access required");
  }
  return user;
}
