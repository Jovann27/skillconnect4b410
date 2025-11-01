import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import Admin from "../models/adminSchema.js";
import sendToken, { sendAdminToken } from "../utils/jwtToken.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (filePath, folder = "skillconnect/admins") => {
  const res = await cloudinary.uploader.upload(filePath, { folder });
  // Clean up temp file after upload
  if (filePath) {
    fs.unlinkSync(filePath);
  }
  return res.secure_url;
};

export const adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorHandler("Please fill all fields", 400));

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) return next(new ErrorHandler("Invalid email or password", 400));

  const isMatched = await admin.comparePassword(password);
  if (!isMatched) return next(new ErrorHandler("Invalid email or password", 400));

  sendAdminToken(admin, 200, res, "Admin logged in successfully");
});

export const adminRegister = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  // Strong password validation
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(password)) {
    return next(new ErrorHandler("Password must include uppercase, lowercase, and numbers", 400));
  }

  // Check if an admin is already authenticated (only existing admins can create new admins)
  if (!req.admin) {
    return next(new ErrorHandler("Only existing administrators can register new admins", 403));
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) return next(new ErrorHandler("Admin already exists", 400));

  let profilePicUrl = "";
  if (req.files?.profilePic) {
    profilePicUrl = await uploadToCloudinary(req.files.profilePic.tempFilePath, "skillconnect/admins");
  }

  const admin = await Admin.create({ name, email, password, profilePic: profilePicUrl });
  sendAdminToken(admin, 201, res, "Admin registered successfully");
});

export const adminLogout = catchAsyncError(async (req, res) => {
  res.cookie("adminToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
  res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

export const getAdminMe = catchAsyncError(async (req, res) => {
  const admin = req.admin;
  res.status(200).json({ success: true, admin });
});
