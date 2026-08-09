import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "unreachable";
    console.error("Database health check failed:", error);
  }

  const memoryUsage = process.memoryUsage();
  const healthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      process: {
        memoryMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
      responseTimeMs: Date.now() - startTime,
    },
    { status: healthy ? 200 : 503 }
  );
}
