import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import Admin from "../models/adminSchema.js";
import sendToken from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (filePath, folder = "skillconnect/admins") => {
  const res = await cloudinary.v2.uploader.upload(filePath, { folder });
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

  sendToken(admin, 200, res, "Admin logged in successfully");
});

export const adminRegister = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  // basic password strength check (you can expand)
  if (password.length < 8) return next(new ErrorHandler("Password must be at least 8 characters", 400));

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) return next(new ErrorHandler("Admin already exists", 400));

  let profilePicUrl = "";
  if (req.files?.profilePic) {
    profilePicUrl = await uploadToCloudinary(req.files.profilePic.tempFilePath, "skillconnect/admins");
  }

  const admin = await Admin.create({ name, email, password, profilePic: profilePicUrl });
  sendToken(admin, 201, res, "Admin registered successfully");
});

export const adminLogout = catchAsyncError(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

export const getAdminMe = catchAsyncError(async (req, res) => {
  const admin = req.admin;
  res.status(200).json({ success: true, admin });
});
