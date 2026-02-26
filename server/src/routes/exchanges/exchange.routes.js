import express from "express";
import { auth } from "../../middleware/auth.js";
import * as exchangeController from "../../controllers/exchanges/exchange.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createExchangeSchema,
  respondExchangeSchema,
  exchangeResponseNoteSchema,
} from "../../validations/exchange.validation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Task exchange operations
router.get("/", exchangeController.getExchanges);
router.get("/project", exchangeController.getProjectExchanges); // Manager-only endpoint
router.get("/sent", exchangeController.getSentExchanges);
router.get("/received", exchangeController.getReceivedExchanges);
router.post(
  "/",
  validateRequest(createExchangeSchema),
  exchangeController.createExchange,
);
router.put(
  "/:id/respond",
  validateRequest(respondExchangeSchema),
  exchangeController.respondToExchange,
);
router.put(
  "/:id/accept",
  validateRequest(exchangeResponseNoteSchema),
  exchangeController.acceptExchange,
);
router.put(
  "/:id/reject",
  validateRequest(exchangeResponseNoteSchema),
  exchangeController.rejectExchange,
);
router.put("/:id/cancel", exchangeController.cancelExchange);
router.delete("/:id", exchangeController.cancelExchange);

export default router;
