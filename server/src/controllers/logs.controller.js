import logger from "../utils/logger.js";

function shrinkContext(context) {
  if (context === undefined) return undefined;
  try {
    const json = JSON.stringify(context);
    if (json.length <= 5000) return context;
    return { truncated: true, length: json.length };
  } catch {
    return { unserializable: true };
  }
}

export const ingestClientLog = async (req, res) => {
  if ((process.env.NODE_ENV || "development") === "production") {
    return res.sendStatus(404);
  }

  const { level, message, context, url, ts } = req.body;

  const meta = {
    source: "client",
    clientUrl: url,
    clientTs: ts,
    userId: req.user?.id || null,
    username: req.user?.username || null,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
    context: shrinkContext(context),
  };

  const method = logger[level] ? level : "info";
  logger[method](`[Client] ${message}`, meta);

  return res.sendStatus(204);
};

