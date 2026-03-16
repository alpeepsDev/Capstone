import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";

const GENERIC_500_MESSAGE = "Something went wrong. Please try again.";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  logger.error("[API Error]", {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    status: typeof err?.status === "number" ? err.status : undefined,
    path: req?.originalUrl || req?.url,
    method: req?.method,
    userId: req?.user?.id,
    stack: err?.stack,
  });

  // Explicit, safe-to-show app errors
  if (err instanceof AppError) {
    const status = typeof err.status === "number" ? err.status : 400;
    const message = err.expose ? err.publicMessage : GENERIC_500_MESSAGE;
    return res.status(status).json({ success: false, message });
  }

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Resource not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Multer/file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File is too large" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ success: false, message: "Unexpected file upload field" });
    }
    return res.status(400).json({ success: false, message: "File upload failed" });
  }

  // Invalid JSON payloads (express.json/body-parser)
  if (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err?.status === 400)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  // Payload too large (body size limits)
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large",
    });
  }

  // If an upstream middleware set a 4xx status, return a safe generic message
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    const fallbackMessageByStatus = {
      400: "Bad request",
      401: "Authentication required",
      403: "Access denied",
      404: "Not found",
      409: "Conflict",
      422: "Unprocessable request",
      429: "Too many requests. Please try again later.",
    };

    return res.status(err.status).json({
      success: false,
      message: fallbackMessageByStatus[err.status] || "Request failed",
    });
  }

  // Default (never leak internal messages)
  return res.status(500).json({
    success: false,
    message: GENERIC_500_MESSAGE,
  });
};
