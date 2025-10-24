import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import VerificationAppointment from "../models/verificationSchema.js";
import User from "../models/userSchema.js";
import Notification from "../models/notification.js";

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
  if (status === "Completed" && markVerified) {
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
