import express from "express";
import { ingestClientLog } from "../controllers/logs.controller.js";
import { endpointRateLimit } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { clientLogSchema } from "../validations/logs.validation.js";

const router = express.Router();

// Dev-only endpoint: accepts client logs and writes them to the server terminal.
router.post(
  "/client",
  endpointRateLimit(120, 1), // per-IP per-minute (best-effort; avoids accidental spam)
  validateRequest(clientLogSchema),
  ingestClientLog,
);

export default router;

