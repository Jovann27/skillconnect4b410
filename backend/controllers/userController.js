import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/userSchema.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncError(async (req, res, next) => {
  const {
    username,
    firstName,
    lastName,
    email,
    phone,
    otherContact,
    address,
    birthdate,
    occupation,
    employed,
    skills,
    appointmentDate,
    certificates,
    validId,
    password,
    confirmPassword, // ✅ confirmation check
    role,
  } = req.body;

  // ✅ Required field check
  if (
    !username ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !address ||
    !birthdate ||
    !validId ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    return next(new ErrorHandler("Please fill up all required fields", 400));
  }

  // ✅ Password match check
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // ✅ Duplicate checks
  const isUsername = await User.findOne({ username });
  if (isUsername) return next(new ErrorHandler("Username already exists", 400));

  const isPhone = await User.findOne({ phone });
  if (isPhone) return next(new ErrorHandler("Phone number already exists", 400));

  const isEmail = await User.findOne({ email });
  if (isEmail) return next(new ErrorHandler("Email already exists", 400));

  // ✅ Create user
  const user = await User.create({
    username,
    firstName,
    lastName,
    email,
    phone,
    otherContact,
    address,
    birthdate,
    occupation,
    employed,
    skills,
    appointmentDate,
    certificates,
    validId,
    password, // only store hashed password
    role,
  });

  // ✅ Send token response
  sendToken(user, 201, res, "User registered successfully");
});


// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return next(new ErrorHandler("Please fill up all fields", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password!", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password!", 400));
  }

  if (user.role !== role) {
    return next(new ErrorHandler("User with this role not found!", 400));
  }

  sendToken(user, 200, res, "User logged in successfully");
});

// LOGOUT
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      success: true,
      message: "User logged out successfully",
    });
});

export const getUser = catchAsyncError((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});