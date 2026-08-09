export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  workspaceSlug?: string;
  actorId?: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  extra?: Record<string, unknown>;
}

class StructuredLogger {
  private formatLog(
    level: LogLevel,
    message: string,
    context?: Partial<Omit<LogPayload, "level" | "message" | "timestamp">>
  ): string {
    const entry: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    return JSON.stringify(entry);
  }

  info(message: string, context?: Partial<Omit<LogPayload, "level" | "message" | "timestamp">>) {
    console.log(this.formatLog("info", message, context));
  }

  warn(message: string, context?: Partial<Omit<LogPayload, "level" | "message" | "timestamp">>) {
    console.warn(this.formatLog("warn", message, context));
  }

  error(
    message: string,
    err?: unknown,
    context?: Partial<Omit<LogPayload, "level" | "message" | "timestamp" | "error">>
  ) {
    let errorObj: LogPayload["error"];
    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      };
    } else if (err) {
      errorObj = {
        name: "UnknownError",
        message: String(err),
      };
    }

    console.error(
      this.formatLog("error", message, {
        ...context,
        error: errorObj,
      })
    );
  }

  debug(message: string, context?: Partial<Omit<LogPayload, "level" | "message" | "timestamp">>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", message, context));
    }
  }
}

export const logger = new StructuredLogger();
