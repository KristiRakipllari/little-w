import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, signToken, requireAdmin } from "@/app/lib/auth";
import { created, error, unauthorized, serverError } from "@/app/lib/response";
import type { User, RegisterRequest } from "@calm-stories/shared";

export async function POST(req: NextRequest) {
  try {
    // Only admins can register new users
    try {
      await requireAdmin(req);
    } catch {
      return unauthorized("Only admins can create accounts");
    }

    const body: RegisterRequest = await req.json();

    if (!body.email || !body.password || !body.name) {
      return error("Email, password, and name are required");
    }

    if (body.password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    // Check if email exists
    const existing = await queryOne(
      "SELECT id FROM users WHERE email = $1",
      [body.email.toLowerCase()]
    );

    if (existing) {
      return error("Email already registered", 409);
    }

    const passwordHash = hashPassword(body.password);
    const role = body.role || "editor";

    const user = await queryOne<User>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at, updated_at`,
      [body.email.toLowerCase(), passwordHash, body.name, role]
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
