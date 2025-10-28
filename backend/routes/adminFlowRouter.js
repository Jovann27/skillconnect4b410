import express from "express";
import { isAdminAuthenticated } from "../middlewares/auth.js";
import {
  scheduleVerificationAppointment,
  updateVerificationAppointment,
  getPendingProviderApplications,
  createService,
  getServices,
  updateAdminServices,
  getAdminServices,
  addUserService,
  editUserService,
  deleteUserService,
  getUserServices
} from "../controllers/adminFlowController.js";

const router = express.Router();

router.post("/verification/schedule", isAdminAuthenticated, scheduleVerificationAppointment);
router.put("/verification/:id", isAdminAuthenticated, updateVerificationAppointment);
router.get("/verification/pending", isAdminAuthenticated, getPendingProviderApplications);

// User service management
router.post("/user/:userId/service/add", isAdminAuthenticated, addUserService);
router.put("/user/:userId/service/edit", isAdminAuthenticated, editUserService);
router.delete("/user/:userId/service/delete", isAdminAuthenticated, deleteUserService);
router.get("/user/:userId/services", isAdminAuthenticated, getUserServices);

export default router;
