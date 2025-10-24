import express from "express";
import { register, login, logout, getMyProfile, updateProfile } from "../controllers/userController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isUserAuthenticated, getMyProfile);
router.put("/update-profile", isUserAuthenticated, updateProfile);


export default router;
