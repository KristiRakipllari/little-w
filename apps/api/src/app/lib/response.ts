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
  console.error("Server error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return error(message, 500);
}
