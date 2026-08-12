import { NextRequest } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { isEmailConfigured } from "@/app/lib/email";
import { success, unauthorized, serverError } from "@/app/lib/response";

// GET /api/auth/me — the current user, plus whether verification is
// enforceable at all.
//
// Without this the app could only learn that verification happened by logging
// out and back in. `verification_enforced` mirrors whether the API can
// actually send mail: when it can't, nobody could ever verify, so the client
// must not gate anything on email_verified.
export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth(req);
    } catch {
      return unauthorized();
    }

    return success({
      user,
      verification_enforced: isEmailConfigured(),
    });
  } catch (err) {
    return serverError(err);
  }
}
