/**
 * Client-side Logger Utility
 * In development, forwards logs to the server so they are visible in the terminal.
 * In production, this logger is a no-op (no browser console output).
 */

const isDev = import.meta.env.DEV;

const LOG_ENDPOINT = "/api/v1/logs/client";
const SENSITIVE_KEY_RE =
  /(authorization|cookie|token|refreshToken|accessToken|password|secret|apiKey|privateKey|jwt)/i;

function sanitize(value, seen = new WeakSet()) {
  // Guard against accidental misuse such as `array.map(sanitize)` where
  // `sanitize` receives the array index as the second argument.
  if (!seen || typeof seen.has !== "function" || typeof seen.add !== "function") {
    seen = new WeakSet();
  }

  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (t !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((v) => sanitize(v, seen));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY_RE.test(k) ? "[REDACTED]" : sanitize(v, seen);
  }
  return out;
}

function toMessageAndContext(args) {
  if (!args || args.length === 0) return { message: "", context: undefined };

  const [first, ...rest] = args;
  if (typeof first === "string") {
    return {
      message: first,
      context: rest.length ? rest.map((v) => sanitize(v)) : undefined,
    };
  }

  return { message: "Client log", context: args.map((v) => sanitize(v)) };
}

function forward(level, ...args) {
  if (!isDev) return;

  const { message, context } = toMessageAndContext(args);
  const payload = {
    level,
    message,
    context,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    ts: Date.now(),
  };

  try {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Best-effort; never blocks UI and never logs to the browser console.
    void fetch(LOG_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "include",
    });
  } catch {
    // swallow
  }
}

const logger = {
  debug: (...args) => {
    forward("debug", ...args);
  },
  info: (...args) => {
    forward("info", ...args);
  },
  warn: (...args) => {
    forward("warn", ...args);
  },
  error: (...args) => {
    forward("error", ...args);
  },
};

export default logger;
