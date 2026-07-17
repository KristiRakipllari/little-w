import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, signToken, requireAdmin } from "@/app/lib/auth";
import { created, error, unauthorized, serverError } from "@/app/lib/response";
import type { User, UserRole, RegisterRequest } from "@calm-stories/shared";

export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequest = await req.json();

    if (!body.email || !body.password) {
      return error("Email and password are required");
    }

    // Same shape the mobile parent-gate validation uses.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }

    if (body.password.length < 8) {
      return error("Password must be at least 8 characters");
    }

    // Display name is optional — the email prefix is a sensible default and
    // deriving it here (not in each client) keeps the rule in one place.
    const name = body.name?.trim() || body.email.split("@")[0];

    // Anyone may sign up as a parent. Staff roles (admin/editor) remain
    // invite-only: they can only be granted by an authenticated admin.
    let role: UserRole = "parent";
    if (body.role && body.role !== "parent") {
      try {
        await requireAdmin(req);
        role = body.role;
      } catch {
        return unauthorized("Only admins can create staff accounts");
      }
    }

    // Check if email exists
    const existing = await queryOne(
      "SELECT id FROM users WHERE email = $1",
      [body.email.toLowerCase()]
    );

    if (existing) {
      return error("Email already registered", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const user = await queryOne<User>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, trial_used, created_at, updated_at`,
      [body.email.toLowerCase(), passwordHash, name, role]
    );

    const token = signToken(user!);

    return created({
      access_token: token,
      user,
    });
  } catch (err) {
    return serverError(err);
  }
}
