import express from "express";
import { register, login, logout, getMyProfile, updateProfile, updateUserPassword, getPasswordLength, sendVerificationOTP, verifyOTP, resetPassword } from "../controllers/userController.js";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from "../controllers/notificationController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isUserAuthenticated, getMyProfile);
router.put("/update-profile", isUserAuthenticated, updateProfile);
router.get("/me/password", isUserAuthenticated, getPasswordLength);
router.put("/password/update", isUserAuthenticated, updateUserPassword)

// Email verification for password reset
router.post("/send-verification-otp", sendVerificationOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Notifications
router.get("/notifications", isUserAuthenticated, getUserNotifications);
router.put("/notifications/:id/read", isUserAuthenticated, markNotificationAsRead);
router.put("/notifications/mark-all-read", isUserAuthenticated, markAllNotificationsAsRead);
router.get("/notifications/unread-count", isUserAuthenticated, getUnreadCount);

export default router;
