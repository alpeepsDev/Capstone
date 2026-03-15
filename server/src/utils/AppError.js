export default class AppError extends Error {
  /**
   * @param {string} publicMessage - Safe, user-readable message.
   * @param {object} [options]
   * @param {number} [options.status=400] - HTTP status code.
   * @param {boolean} [options.expose=true] - Whether the publicMessage may be returned to clients.
   * @param {string} [options.code] - Optional internal/app error code (not Prisma).
   * @param {string} [options.logMessage] - Optional richer message for server logs.
   */
  constructor(
    publicMessage,
    { status = 400, expose = true, code, logMessage } = {},
  ) {
    super(logMessage || publicMessage);
    this.name = "AppError";
    this.publicMessage = publicMessage;
    this.status = status;
    this.expose = expose;
    if (code) this.appCode = code;

    // Ensure stack points to caller
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AppError);
    }
  }
}

