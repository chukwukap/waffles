/**
 * Structured logging utility for server-side operations.
 * Provides consistent JSON logging format for monitoring and debugging.
 *
 * Usage:
 *   logger.info("partykit", "init_success", { gameId, startsAt });
 *   logger.error("partykit", "roundup_failed", { gameId, error });
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogData {
  ts: string;
  level: LogLevel;
  service: string;
  event: string;
  [key: string]: unknown;
}

function formatLog(
  level: LogLevel,
  service: string,
  event: string,
  data?: Record<string, unknown>
): LogData {
  return {
    ts: new Date().toISOString(),
    level,
    service,
    event,
    ...data,
  };
}

function output(level: LogLevel, logData: LogData): void {
  const logString = JSON.stringify(logData);

  switch (level) {
    case "ERROR":
      console.error(logString);
      break;
    case "WARN":
      console.warn(logString);
      break;
    case "DEBUG":
      console.debug(logString);
      break;
    default:
      console.log(logString);
  }
}

export const logger = {
  debug(service: string, event: string, data?: Record<string, unknown>) {
    output("DEBUG", formatLog("DEBUG", service, event, data));
  },

  info(service: string, event: string, data?: Record<string, unknown>) {
    output("INFO", formatLog("INFO", service, event, data));
  },

  warn(service: string, event: string, data?: Record<string, unknown>) {
    output("WARN", formatLog("WARN", service, event, data));
  },

  error(service: string, event: string, data?: Record<string, unknown>) {
    output("ERROR", formatLog("ERROR", service, event, data));
  },

  /**
   * Helper to safely extract error message from unknown error type
   */
  errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  },
};

export default logger;
