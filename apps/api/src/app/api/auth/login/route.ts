import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, verifyPassword, signToken } from "@/app/lib/auth";
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

    if (!user || !verifyPassword(body.password, user.password_hash)) {
      return error("Invalid email or password", 401);
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
