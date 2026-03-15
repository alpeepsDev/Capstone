import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const env = process.env.NODE_ENV || "development";
const defaultLevel = env === "development" ? "debug" : "info";
const effectiveLevel = process.env.LOG_LEVEL || defaultLevel;

const colors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const SENSITIVE_KEY_RE = /(authorization|cookie|token|refreshToken|accessToken|password|secret|apiKey|privateKey|jwt)/i;

function redact(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v) => redact(v, seen));
  }

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = redact(val, seen);
  }
  return out;
}

function safeJson(value, maxLen = 8000) {
  try {
    const json = JSON.stringify(redact(value));
    if (json.length <= maxLen) return json;
    return `${json.slice(0, maxLen)}…(truncated)`;
  } catch {
    return "[Unserializable metadata]";
  }
}

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
);

const formatLine = winston.format.printf((info) => {
  const meta =
    info.metadata && Object.keys(info.metadata).length > 0
      ? ` ${safeJson(info.metadata)}`
      : "";

  const stack = info.stack ? `\n${info.stack}` : "";
  return `${info.timestamp} ${info.level}: ${info.message}${meta}${stack}`;
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    baseFormat,
    env === "development"
      ? winston.format.colorize({ all: true })
      : winston.format.uncolorize(),
    formatLine,
  ),
});

const transports = [consoleTransport];

// In production, add file logging
if (env === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(baseFormat, winston.format.uncolorize(), formatLine),
    }),
    new winston.transports.File({
      filename: "logs/all.log",
      format: winston.format.combine(baseFormat, winston.format.uncolorize(), formatLine),
    }),
  );
}

const logger = winston.createLogger({
  level: effectiveLevel,
  levels,
  transports,
  exitOnError: false,
});

export default logger;
