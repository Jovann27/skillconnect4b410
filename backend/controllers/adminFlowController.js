import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import VerificationAppointment from "../models/verificationSchema.js";
import User from "../models/userSchema.js";
import Admin from "../models/adminSchema.js";
import Notification from "../models/notification.js";
import Service from "../models/service.js";

// simple notify helper
const sendNotification = async (userId, title, message, meta = {}) => {
  try {
    const n = await Notification.create({ user: userId, title, message, meta });
    return n;
  } catch (err) {
    console.error("sendNotification error:", err);
    return null;
  }
};

// Schedule a verification appointment (admin)
export const scheduleVerificationAppointment = catchAsyncError(async (req, res, next) => {
  const { providerId, appointmentDate, location } = req.body;
  if (!providerId || !appointmentDate) return next(new ErrorHandler("Missing required fields", 400));
  // must be admin (assume isAdminAuthenticated middleware sets req.admin)
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));

  const provider = await User.findById(providerId);
  if (!provider) return next(new ErrorHandler("Provider not found", 404));

  const appt = await VerificationAppointment.create({
    provider: provider._id,
    scheduledBy: req.admin._id,
    appointmentDate: new Date(appointmentDate),
    location,
    status: "Pending",
  });

  await sendNotification(provider._id, "Verification Appointment Scheduled", `Your verification appointment is scheduled on ${appt.appointmentDate.toISOString()}`, { apptId: appt._id });

  res.status(201).json({ success: true, appt });
});

// Admin updates appointment status (confirm/completed/cancel)
export const updateVerificationAppointment = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks, markVerified } = req.body;
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));

  const appt = await VerificationAppointment.findById(id);
  if (!appt) return next(new ErrorHandler("Appointment not found", 404));

  if (status) appt.status = status;
  if (remarks) appt.remarks = remarks;

  await appt.save();

  // Optionally mark provider verified when appointment completed and markVerified flag provided
  if (status === "Complete" && markVerified) {
    const provider = await User.findById(appt.provider);
    if (provider) {
      provider.verified = true;
      provider.isApplyingProvider = false;
      await provider.save();
      await sendNotification(provider._id, "Verification Completed", "Your account is now verified as a Service Provider.");
    }
  }

  res.json({ success: true, appt });
});

// Get providers pending verification
export const getPendingProviderApplications = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const pending = await User.find({ role: "Service Provider", verified: false, isApplyingProvider: true }).select("-password");
  res.json({ success: true, count: pending.length, pending });
});

// Create a new service (admin only)
export const createService = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { name, description, rate } = req.body;
  if (!name || !description || !rate) return next(new ErrorHandler("Missing required fields", 400));

  const service = await Service.create({
    name,
    description,
    rate,
    createdBy: req.admin._id,
  });

  res.status(201).json({ success: true, service });
});

// Get all services
export const getServices = catchAsyncError(async (req, res, next) => {
  const services = await Service.find().sort({ createdAt: -1 });
  res.json({ success: true, services });
});

// Update admin services (admin only)
export const updateAdminServices = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { services } = req.body;
  if (!Array.isArray(services)) return next(new ErrorHandler("Services must be an array", 400));

  const admin = await Admin.findById(req.admin._id);
  if (!admin) return next(new ErrorHandler("Admin not found", 404));

  admin.services = services;
  await admin.save();

  res.json({ success: true, services: admin.services });
});

// Get admin services
export const getAdminServices = catchAsyncError(async (req, res, next) => {
  const admin = await Admin.findOne({ role: "Admin" }).select("services");
  if (!admin) return next(new ErrorHandler("Admin not found", 404));

  res.json({ success: true, services: admin.services });
});

// Add service to user (admin only)
export const addUserService = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { userId, service } = req.body;
  if (!userId || !service) return next(new ErrorHandler("Missing required fields", 400));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (!user.services.includes(service)) {
    user.services.push(service);
    await user.save();
  }

  res.json({ success: true, services: user.services });
});

// Edit user service (admin only)
export const editUserService = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { userId, oldService, newService } = req.body;
  if (!userId || !oldService || !newService) return next(new ErrorHandler("Missing required fields", 400));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const index = user.services.indexOf(oldService);
  if (index > -1) {
    user.services[index] = newService;
    await user.save();
  }

  res.json({ success: true, services: user.services });
});

// Delete user service (admin only)
export const deleteUserService = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { userId, service } = req.body;
  if (!userId || !service) return next(new ErrorHandler("Missing required fields", 400));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.services = user.services.filter(s => s !== service);
  await user.save();

  res.json({ success: true, services: user.services });
});

// Get user services (admin only)
export const getUserServices = catchAsyncError(async (req, res, next) => {
  if (!req.admin) return next(new ErrorHandler("Admin only", 401));
  const { userId } = req.params;
  if (!userId) return next(new ErrorHandler("User ID required", 400));

  const user = await User.findById(userId).select("services");
  if (!user) return next(new ErrorHandler("User not found", 404));

  res.json({ success: true, services: user.services });
});
