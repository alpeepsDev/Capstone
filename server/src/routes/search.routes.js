import express from "express";
import { globalSearch } from "../controllers/search.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { searchQuerySchema } from "../validations/search.validation.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  validateRequest(searchQuerySchema, "query"),
  globalSearch,
);

export default router;
