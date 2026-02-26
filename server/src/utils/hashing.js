import crypto from "crypto";

/**
 * Creates a deterministic hash of the input string using SHA-256.
 * specific fields like usernameHash and emailHash.
 * @param {string} text - The text to hash
 * @returns {string} The hexadecimal hash string
 */
export const hash = (text) => {
  if (!text) return text;
  return crypto.createHash("sha256").update(text).digest("hex");
};
