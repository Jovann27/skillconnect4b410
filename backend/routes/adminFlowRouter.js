import express from "express";
import { isAdminAuthenticated } from "../middlewares/auth.js";
import {
  scheduleVerificationAppointment,
  updateVerificationAppointment,
  getPendingProviderApplications
} from "../controllers/adminFlowController.js";

const router = express.Router();

router.post("/verification/schedule", isAdminAuthenticated, scheduleVerificationAppointment);
router.put("/verification/:id", isAdminAuthenticated, updateVerificationAppointment);
router.get("/verification/pending", isAdminAuthenticated, getPendingProviderApplications);

export default router;