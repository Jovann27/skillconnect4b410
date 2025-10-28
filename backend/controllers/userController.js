import User from "../models/userSchema.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import sendToken from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

const uploadToCloudinary = async (filePath, folder) => {
  const res = await cloudinary.v2.uploader.upload(filePath, { folder });
  return res.secure_url;
};

export const register = catchAsyncError(async (req, res, next) => {
  const { username, firstName, lastName, email, phone, address, birthdate, employed, password, confirmPassword, role } = req.body;

  if (!username || !firstName || !lastName || !email || !phone || !address || !birthdate || !password || !confirmPassword || !role) {
    return next(new ErrorHandler("Please fill up all required fields", 400));
  }

  if (password !== confirmPassword) return next(new ErrorHandler("Passwords do not match", 400));
  if (password.length < 8) return next(new ErrorHandler("Password must be at least 8 characters", 400));

  const [isUsername, isPhone, isEmail] = await Promise.all([
    User.findOne({ username }),
    User.findOne({ phone }),
    User.findOne({ email }),
  ]);

  if (isUsername) return next(new ErrorHandler("Username already exists", 400));
  if (isPhone) return next(new ErrorHandler("Phone already exists", 400));
  if (isEmail) return next(new ErrorHandler("Email already exists", 400));

  const validIdFile = req.files?.validId;
  let uploadedFiles = {};

  // Only require validId for Service Providers
  if (role === "Service Provider") {
    if (!validIdFile) return next(new ErrorHandler("Valid ID is required for Service Providers", 400));
    if (!validIdFile.mimetype.startsWith("image/")) {
      return next(new ErrorHandler("Valid ID must be an image file (JPG, PNG, etc.)", 400));
    }
    uploadedFiles.validId = await uploadToCloudinary(validIdFile.tempFilePath, "skillconnect/validIds");
  }

  if (req.files?.profilePic) uploadedFiles.profilePic = await uploadToCloudinary(req.files.profilePic.tempFilePath, "skillconnect/profiles");

  const certificatePaths = [];
  if (req.files?.certificates) {
    const filesArray = Array.isArray(req.files.certificates) ? req.files.certificates : [req.files.certificates];
    // upload in parallel
    const uploads = await Promise.all(filesArray.map(file => uploadToCloudinary(file.tempFilePath, "skillconnect/certificates")));
    certificatePaths.push(...uploads);
  }

  // Normalize skills if provided
  let normalizedSkills = [];
  if (req.body.skills) {
    const incoming = Array.isArray(req.body.skills) ? req.body.skills : (typeof req.body.skills === 'string' ? req.body.skills.split(',') : []);
    normalizedSkills = incoming.map(s => s.toString().trim().toLowerCase()).filter(Boolean);
  }

  const user = await User.create({
    username, firstName, lastName, email, phone, address, birthdate, employed,
    password, role,
    validId: uploadedFiles.validId,
    profilePic: uploadedFiles.profilePic || "",
    certificates: certificatePaths,
    skills: normalizedSkills,
  });

  sendToken(user, 201, res, "User registered successfully");
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorHandler("Please fill up all fields", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid email or password!", 400));

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) return next(new ErrorHandler("Invalid email or password!", 400));

  sendToken(user, 200, res, `${user.role} logged in successfully`);
});

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

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const updates = req.body;

  delete updates.password;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  // Validate email uniqueness if email is being updated
  if (updates.email) {
    const existingUser = await User.findOne({ email: updates.email });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Email already exists", 400));
    }
  }

  // Validate phone uniqueness if phone is being updated
  if (updates.phone) {
    const existingUser = await User.findOne({ phone: updates.phone });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Phone already exists", 400));
    }
  }

  // Handle profile picture upload if provided
  if (req.files?.profilePic) {
    const profilePicUrl = await uploadToCloudinary(req.files.profilePic.tempFilePath, "skillconnect/profiles");
    updates.profilePic = profilePicUrl;
  }

  // Handle valid ID upload if provided
  if (req.files?.validId) {
    // Validate that validId is an image
    if (!req.files.validId.mimetype.startsWith("image/")) {
      return next(new ErrorHandler("Valid ID must be an image file (JPG, PNG, etc.)", 400));
    }
    const validIdUrl = await uploadToCloudinary(req.files.validId.tempFilePath, "skillconnect/validIds");
    updates.validId = validIdUrl;
  }

  // Handle certificate uploads if provided
  if (req.files?.certificates) {
    const filesArray = Array.isArray(req.files.certificates) ? req.files.certificates : [req.files.certificates];
    const certificatePaths = await Promise.all(
      filesArray.map(file => uploadToCloudinary(file.tempFilePath, "skillconnect/certificates"))
    );
    updates.certificates = certificatePaths;
  }

  // Normalize skills if provided
  if (updates.skills) {
    const incoming = Array.isArray(updates.skills) ? updates.skills : (typeof updates.skills === 'string' ? updates.skills.split(',') : []);
    updates.skills = incoming.map(s => s.toString().trim().toLowerCase()).filter(Boolean);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser
  });
});

export const getSignedValidIdUrl = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (!user.validId) return next(new ErrorHandler("No valid ID found", 404));

  // Extract public_id from the URL
  const urlParts = user.validId.split('/');
  const publicIdWithExtension = urlParts.slice(-1)[0]; // e.g., "ijef1xfia9hmg6xlkz6y.pdf"
  const publicId = publicIdWithExtension.split('.')[0]; // e.g., "ijef1xfia9hmg6xlkz6y"
  const fullPublicId = `skillconnect/validIds/${publicId}`; // Assuming folder structure

  // Generate signed URL for the validId
  const signedUrl = cloudinary.v2.utils.private_download_url(fullPublicId, 'pdf', {
    resource_type: 'raw',
    type: 'private',
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  });

  res.status(200).json({
    success: true,
    signedUrl
  });
});
