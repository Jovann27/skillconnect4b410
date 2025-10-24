import express from "express";
import {
  createJobFair,
  adminGetAllServiceRequests,
  banUser ,
  verifyUser,
  getAllUsers,
  getServiceProviders,
  getDashboardMetrics,
} from "../controllers/adminController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.post("/jobfairs", isAdminAuthenticated, createJobFair);
router.get("/service-requests", isAdminAuthenticated, adminGetAllServiceRequests);
router.get("/dashboard-metrics", isAdminAuthenticated, getDashboardMetrics);
router.get("/users", isAdminAuthenticated, authorizeRoles("Admin"), getAllUsers);
router.put("/user/verify/:id", isAdminAuthenticated, authorizeRoles("Admin"), verifyUser);
router.delete("/user/:id", isAdminAuthenticated, authorizeRoles("Admin"), banUser);
router.get("/service-providers", isAdminAuthenticated, getServiceProviders);

export default router;
