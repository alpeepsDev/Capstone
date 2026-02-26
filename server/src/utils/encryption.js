import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Ensure the key is 32 bytes (256 bits)
// If the key is shorter/longer, you might want to hash it or enforce length.
// For now, we'll assume the user provides a valid 32-char string or use a fallback for dev if missing (WARNING: insecure fallback)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 chars
const IV_LENGTH = 16; // AES block size

export const encrypt = (text) => {
  if (!text) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    // Ideally, throw or handle, but for now return original to avoid data loss (though it won't be encrypted)
    // Or throw to prevent saving unencrypted data?
    // Let's throw to be safe
    throw new Error("Failed to encrypt data");
  }
};

export const decrypt = (text) => {
  if (!text) return text;

  try {
    const textParts = text.split(":");

    // If it doesn't look like our encrypted format (iv:content), return as is (maybe legacy data)
    if (textParts.length < 2) return text;

    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    // Fallback: return original text if decryption fails (might be unencrypted data)
    return text;
  }
};

/**
 * Decrypts the PII fields on a user object (username, name, email).
 * Safe to call on null/undefined — returns the input as-is.
 * Works on both full user objects and nested select objects.
 */
export const decryptUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    username: user.username ? decrypt(user.username) : user.username,
    name: user.name ? decrypt(user.name) : user.name,
    email: user.email ? decrypt(user.email) : user.email,
  };
};
