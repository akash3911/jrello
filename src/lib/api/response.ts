import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function apiError(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json({ error: message, details }, { status });
}

export const apiUnauthorized = () => apiError("Unauthorized", 401);
export const apiNotFound = (what = "Resource") => apiError(`${what} not found`, 404);

export function apiZodError(error: ZodError) {
  return NextResponse.json(
    {
      error: "Invalid payload",
      details: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    },
    { status: 400 }
  );
}

/** Map low-level data errors to friendly API errors. */
export function apiDataError(scope: string, error: unknown) {
  if (error instanceof ZodError) return apiZodError(error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[]).join(", ")
      : "field";
    return apiError(`Already exists (conflict on ${target})`, 409);
  }

  console.error(`[api] ${scope} failed:`, error);
  return apiError(`Failed to ${scope}`, 500);
}
