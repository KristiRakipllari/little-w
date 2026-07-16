import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, verifyPassword, isLegacyHash, signToken } from "@/app/lib/auth";
import { success, error, serverError } from "@/app/lib/response";
import type { User, LoginRequest } from "@calm-stories/shared";

export async function POST(req: NextRequest) {
  try {
    const body: LoginRequest = await req.json();

    if (!body.email || !body.password) {
      return error("Email and password are required");
    }

    const user = await queryOne<User & { password_hash: string }>(
      "SELECT * FROM users WHERE email = $1",
      [body.email.toLowerCase()]
    );

    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return error("Invalid email or password", 401);
    }

    // Migrate-on-login: silently upgrade pre-bcrypt (SHA-256) hashes now
    // that we hold the verified plaintext. Users notice nothing.
    if (isLegacyHash(user.password_hash)) {
      const upgraded = await hashPassword(body.password);
      await queryOne("UPDATE users SET password_hash = $1 WHERE id = $2", [
        upgraded,
        user.id,
      ]);
    }

    // The free week is the account's first 7 days (the lifetime of its first
    // JWT). Persisting consumption here makes it survive reinstalls and
    // cleared app data — the client re-learns it on every login.
    if (!user.trial_used) {
      const consumed = await queryOne<{ trial_used: boolean }>(
        `UPDATE users SET trial_used = true
         WHERE id = $1 AND created_at + INTERVAL '7 days' < NOW()
         RETURNING trial_used`,
        [user.id]
      );
      if (consumed) user.trial_used = true;
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser as User);

    return success({
      access_token: token,
      user: safeUser,
    });
  } catch (err) {
    return serverError(err);
  }
}
