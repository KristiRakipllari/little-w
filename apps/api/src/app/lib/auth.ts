import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { queryOne } from "@calm-stories/db";
import type { User } from "@calm-stories/shared";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "7d") as jwt.SignOptions["expiresIn"];

// ─── Password hashing ────────────────────────

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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
    "SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1",
    [payload.id]
  );

  return user;
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
