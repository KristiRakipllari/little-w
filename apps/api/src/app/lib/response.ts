import { NextResponse } from "next/server";
import type { ApiResponse } from "@calm-stories/shared";

export function success<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data } as ApiResponse<T>,
    { status }
  );
}

export function created<T>(data: T) {
  return success(data, 201);
}

export function error(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message } as ApiResponse<never>,
    { status }
  );
}

export function unauthorized(message = "Unauthorized") {
  return error(message, 401);
}

export function forbidden(message = "Forbidden") {
  return error(message, 403);
}

export function notFound(message = "Not found") {
  return error(message, 404);
}

export function serverError(err: unknown) {
  // Log the real error server-side; clients get a generic message — raw
  // err.message leaks internals (DB constraint names, file paths).
  console.error("Server error:", err);
  return error("Internal server error", 500);
}
