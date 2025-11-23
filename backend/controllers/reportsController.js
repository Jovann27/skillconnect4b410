import Report from "../models/report.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/userSchema.js";
import Booking from "../models/booking.js";

// Analytics Reports
export const totalsReport = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Totals report - placeholder implementation",
    data: {
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0
    }
  });
});

export const demographicsReport = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Demographics report - placeholder implementation",
    data: []
  });
});

export const skillsReport = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Skills report - placeholder implementation",
    data: []
  });
});

export const skilledPerTrade = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Skilled per trade report - placeholder implementation",
    data: []
  });
});

export const mostBookedServices = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Most booked services report - placeholder implementation",
    data: []
  });
});

export const totalsOverTime = catchAsyncError(async (req, res, next) => {
  // Placeholder implementation
  res.status(200).json({
    success: true,
    message: "Totals over time report - placeholder implementation",
    data: []
  });
});

// User Reports
export const reportUser = catchAsyncError(async (req, res, next) => {
  const { reportedUserId, reason, description, appointmentId } = req.body;
  const reporterId = req.user._id;

  if (!reportedUserId || !reason) {
    return next(new ErrorHandler("Reported user ID and reason are required", 400));
  }

  if (reporterId.toString() === reportedUserId.toString()) {
    return next(new ErrorHandler("Cannot report yourself", 400));
  }

  // Check if reported user exists
  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    return next(new ErrorHandler("Reported user not found", 404));
  }

  // Check if reporter exists
  const reporter = await User.findById(reporterId);
  if (!reporter) {
    return next(new ErrorHandler("Reporter not found", 404));
  }

  // Check if user has already reported this person recently (within last 24 hours)
  const recentReport = await Report.findOne({
    reporter: reporterId,
    reportedUser: reportedUserId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  if (recentReport) {
    return next(new ErrorHandler("You have already reported this user recently. Please wait before submitting another report.", 400));
  }

  const report = await Report.create({
    reporter: reporterId,
    reportedUser: reportedUserId,
    reason: reason.trim(),
    description: description ? description.trim() : "",
    appointment: appointmentId || null
  });

  res.status(201).json({
    success: true,
    message: "User reported successfully. Our team will review your report.",
    report: {
      id: report._id,
      status: report.status,
      createdAt: report.createdAt
    }
  });
});

// Get reports (for admin use)
export const getReports = catchAsyncError(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const reports = await Report.find(query)
    .populate('reporter', 'firstName lastName email')
    .populate('reportedUser', 'firstName lastName email')
    .populate('appointment', 'serviceRequest')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    reports,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReports: total
    }
  });
});

// Update report status (for admin use)
export const updateReportStatus = catchAsyncError(async (req, res, next) => {
  const { reportId } = req.params;
  const { status } = req.body;

  if (!["pending", "investigating", "resolved", "dismissed"].includes(status)) {
    return next(new ErrorHandler("Invalid status", 400));
  }

  const report = await Report.findByIdAndUpdate(
    reportId,
    { status, updatedAt: new Date() },
    { new: true }
  ).populate('reporter', 'firstName lastName email')
   .populate('reportedUser', 'firstName lastName email');

  if (!report) {
    return next(new ErrorHandler("Report not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Report status updated successfully",
    report
  });
});
