import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  getSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  applySavedFilter,
} from "../../controllers/labels/savedFilter.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createFilterSchema,
  updateFilterSchema,
} from "../../validations/savedFilter.validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", getSavedFilters);
router.post("/", validateRequest(createFilterSchema), createSavedFilter);
router.put("/:id", validateRequest(updateFilterSchema), updateSavedFilter);
router.delete("/:id", deleteSavedFilter);
router.post("/:id/apply", applySavedFilter);

export default router;
