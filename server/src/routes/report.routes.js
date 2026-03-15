import express from "express";
import { generateReport, exportReport } from "../controllers/report.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All report routes require authentication
router.use(auth);

// Admin, Managers and Users can generate/view reports (filtered by role in controller)
router.get("/", generateReport);

// All roles can export the report they can see
router.post("/export", exportReport);

export default router;
