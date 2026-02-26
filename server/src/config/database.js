import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { decrypt } from "../utils/encryption.js";
import { emitAdminUpdate } from "../services/websocket.service.js";

// ---------------------------------------------------------------------------
// Auto-decrypt User PII fields on every read via Prisma Client Extensions
// ---------------------------------------------------------------------------
const USER_PII_FIELDS = ["username", "name", "email"];
const PROJECT_ENCRYPTED_FIELDS = ["name", "description"];

/**
 * Recursively walk an object / array returned by Prisma and decrypt any user
 * PII it finds. User objects are identified by having an `id` + `username`
 * key pair (or `id` + `name`). This covers: direct User queries, and nested
 * relations like assignee, createdBy, manager, author, members[].user, etc.
 */
function decryptUserFields(obj) {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      decryptUserFields(item);
    }
    return obj;
  }

  // If this looks like a user object, decrypt its PII fields
  const looksLikeUser =
    typeof obj.id === "string" &&
    (typeof obj.username === "string" || typeof obj.name === "string") &&
    // Quick guard: skip objects that are clearly NOT users (e.g. projects have a name too).
    // Users will NOT have typical project-only keys like managerId or totalBudget.
    !("managerId" in obj) &&
    !("totalBudget" in obj) &&
    !("projectId" in obj && "title" in obj); // tasks have projectId + title

  if (looksLikeUser) {
    for (const field of USER_PII_FIELDS) {
      if (typeof obj[field] === "string") {
        obj[field] = decrypt(obj[field]);
      }
    }
  }

  // Recurse into all values (handles nested relations)
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null) {
      decryptUserFields(value);
    }
  }

  return obj;
}

/**
 * Recursively walk an object / array returned by Prisma and decrypt any
 * project encrypted fields (name, description). Project objects are identified
 * by having `managerId` as a key (distinguishes them from users and tasks).
 */
function decryptProjectFields(obj) {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      decryptProjectFields(item);
    }
    return obj;
  }

  // If this looks like a project object, decrypt its encrypted fields
  const looksLikeProject =
    typeof obj.id === "string" &&
    "managerId" in obj &&
    typeof obj.name === "string";

  if (looksLikeProject) {
    for (const field of PROJECT_ENCRYPTED_FIELDS) {
      if (typeof obj[field] === "string") {
        obj[field] = decrypt(obj[field]);
      }
    }
  }

  // Recurse into all values (handles nested relations)
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null) {
      decryptProjectFields(value);
    }
  }

  return obj;
}

// Actions whose results should be auto-decrypted
const DECRYPT_ACTIONS = new Set([
  "findUnique",
  "findFirst",
  "findMany",
  "create",
  "update",
  "upsert",
  "delete",
]);

// Actions that change data and should notify admins
const MUTATION_ACTIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

// Models that we care about for admin dashboard realtime updates
const ADMIN_WATCHED_MODELS = new Set(["User", "Project", "Task"]);

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }) => {
      const result = await query(args);

      if (DECRYPT_ACTIONS.has(operation)) {
        decryptUserFields(result);
        decryptProjectFields(result);
      }

      if (
        model &&
        MUTATION_ACTIONS.has(operation) &&
        ADMIN_WATCHED_MODELS.has(model)
      ) {
        // Broadcast the update immediately after the DB finishes the query
        // Fire-and-forget
        emitAdminUpdate(model, operation);
      }

      return result;
    },
  },
});

export default prisma;
