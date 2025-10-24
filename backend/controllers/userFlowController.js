import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import User from "../models/userSchema.js";
import ServiceRequest from "../models/serviceRequest.js";
import Review from "../models/review.js";
import verificationAppointmentSchema from "../models/verificationSchema.js";
import Notification from "../models/notification.js";

const sendNotification = async (userId, title, message, meta = {}) => {
  try {
    const n = await Notification.create({ user: userId, title, message, meta });
    // Optionally: push real-time event (socket, email)
    return n;
  } catch (err) {
    console.error("sendNotification error:", err.message);
    return null;
  }
};


export const applyProvider = catchAsyncError(async (req, res, next) => {
  const { skills, certificates } = req.body;
  if (!req.user) 
    return next(
    new ErrorHandler("Unauthorized", 401));

  const user = 
  await User.findById(req.user._id);
  if (!user) 
    return next(
      new ErrorHandler("User not found", 404));

  user.isApplyingProvider = true;
  user.skills = Array.isArray(skills) ? skills : (skills ? skills.toString().split(",").map(s => s.trim()) : user.skills);
  if (certificates) user.certificates = Array.isArray(certificates) ? certificates : [certificates];
  user.role = "Service Provider"; // user requested provider role but still unverified
  await user.save();

  await sendNotification
  (user._id, "Provider Application Received", 
    "Your application to become a Service Provider was received. An admin will review it soon.", 
    { type: "apply-provider" });

  res.status(200).json({ success: true, message: "Applied to become provider", user });
});



export const postServiceRequest = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const { name, address, phone, typeOfWork, time, budget, notes, location, targetProvider } = req.body;
  if (!name || !address || !phone || !typeOfWork || !time) return next(new ErrorHandler("Missing required fields", 400));

  const request = await ServiceRequest.create({
    requester: req.user._id,
    name,
    address,
    phone,
    typeOfWork,
    time,
    budget: budget || 0,
    notes,
    location: location || null,
    targetProvider,
    status: "Open",
  });

  // Optionally notify providers in the same category (not implemented here, but can query by skill)
  res.status(201).json({ success: true, request });
});



export const updateBookingStatus = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const { id } = req.params;
  const { status } = req.body;
  const booking = await Booking.findById(id);
  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  const allowed = ["Pending", "Confirmed", "InProgress", "Completed", "Cancelled"];
  if (!allowed.includes(status)) return next(new ErrorHandler("Invalid status", 400));

  if (![String(booking.requester), String(booking.provider)].includes(String(req.user._id))) {
    return next(new ErrorHandler("Not authorized", 403));
  }

  booking.status = status;
  await booking.save();

  const otherUser = String(booking.requester) === String(req.user._id) ? booking.provider : booking.requester;
  await sendNotification(otherUser, `Booking ${status}`, `Booking ${booking._id} status changed to ${status}`);

  res.json({ success: true, booking });
});

export const leaveReview = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const { bookingId, rating, comments } = req.body;
  if (!bookingId || !rating) return next(new ErrorHandler("Missing required fields", 400));

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new ErrorHandler("Booking not found", 404));
  if (booking.status !== "Completed") return next(new ErrorHandler("Booking not completed yet", 400));
  // Only participants can leave review (requester or provider)
  if (![String(booking.requester), String(booking.provider)].includes(String(req.user._id))) {
    return next(new ErrorHandler("Not authorized", 403));
  }

  const review = await Review.create({
    booking: booking._id,
    reviewer: req.user._id,
    reviewee: String(booking.requester) === String(req.user._id) ? booking.provider : booking.requester,
    rating,
    comments,
  });

  await sendNotification(review.reviewee, "New Review", `You received a ${rating}-star review.`);

  res.status(201).json({ success: true, review });
});

export const getServiceRequests = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  // Get provider's skills for filtering
  const providerSkills = req.user.skills || [];

  // First, let's see all open requests
  const allRequests = await ServiceRequest.find({ status: "Open" })
    .populate({
      path: 'requester',
      select: 'firstName lastName username email phone',
      model: 'User'
    })
    .sort({ createdAt: -1 });

  // Filter requests based on provider's skills if they have skills
  let filteredRequests = allRequests;

  if (providerSkills.length > 0) {
    filteredRequests = allRequests.filter(request => {
      // Check if request typeOfWork matches any of provider's skills
      return providerSkills.some(skill =>
        request.typeOfWork?.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(request.typeOfWork?.toLowerCase())
      );
    });
  }

  // Also include requests specifically targeted to this provider
  const targetedRequests = await ServiceRequest.find({
    status: "Open",
    targetProvider: req.user._id
  })
  .populate({
    path: 'requester',
    select: 'firstName lastName username email phone',
    model: 'User'
  })
  .sort({ createdAt: -1 });

  // Combine filtered requests with targeted requests (avoid duplicates)
  const targetedIds = targetedRequests.map(r => r._id.toString());
  const combinedRequests = [
    ...targetedRequests,
    ...filteredRequests.filter(r => !targetedIds.includes(r._id.toString()))
  ];

  // For testing purposes, if no requests match skills, return all open requests
  let finalRequests = combinedRequests;
  if (combinedRequests.length === 0 && allRequests.length > 0) {
    finalRequests = allRequests;
  }

  res.status(200).json({
    success: true,
    requests: finalRequests,
    debug: {
      totalRequests: finalRequests.length,
      allOpenRequests: allRequests.length,
      filteredRequests: filteredRequests.length,
      targetedRequests: targetedRequests.length,
      userId: req.user._id,
      userRole: req.user.role,
      userSkills: providerSkills,
      sampleRequester: finalRequests[0]?.requester || null
    }
  });
});



export const getUserServiceRequests = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const requests = await ServiceRequest.find({ requester: req.user._id })
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, requests });
});

export const cancelServiceRequest = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const { id } = req.params;
  const request = await ServiceRequest.findById(id);
  if (!request) return next(new ErrorHandler("Service Request not found", 404));
  if (String(request.requester) !== String(req.user._id)) return next(new ErrorHandler("Not authorized", 403));
  if (request.status !== "Open") return next(new ErrorHandler("Request cannot be cancelled", 400));

  request.status = "Cancelled";
  await request.save();

  res.status(200).json({ success: true, message: "Request cancelled" });
});

export const acceptServiceRequest = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const { id } = req.params;
  const request = await ServiceRequest.findById(id).populate('requester');
  if (!request) return next(new ErrorHandler("Service Request not found", 404));
  if (request.status !== "Open") return next(new ErrorHandler("Request is not open", 400));

  // Ensure provider
  const provider = await User.findById(req.user._id);
  if (!provider || provider.role !== "Service Provider") return next(new ErrorHandler("Not a provider", 403));
  if (!provider.verified) return next(new ErrorHandler("Provider not verified", 403));

  // Create booking
  const booking = await Booking.create({
    requester: request.requester._id,
    provider: provider._id,
    serviceRequest: request._id,
    status: "Pending",
  });

  // Mark request assigned & set provider
  request.status = "Assigned";
  request.serviceProvider = provider._id;
  await request.save();

  // Notify requester
  await sendNotification(
    request.requester._id,
    "Request Accepted",
    `Your request "${request.name}" has been accepted by ${provider.firstName} ${provider.lastName}`,
    { bookingId: booking._id }
  );

  res.status(201).json({ success: true, booking, request });
});

export const getBookings = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));
  const bookings = await Booking.find({
    $or: [{ requester: req.user._id }, { provider: req.user._id }]
  }).populate('requester provider', 'firstName lastName');
  res.status(200).json({ success: true, bookings });
});



export const getServiceProfile = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const serviceProfile = {
    service: user.service || '',
    rate: user.serviceRate || '',
    description: user.serviceDescription || '',
    isOnline: user.isOnline !== false // default to true if not set
  };

  res.status(200).json({ success: true, data: serviceProfile });
});

export const updateServiceProfile = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  const { service, rate, description } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.service = service || user.service;
  user.serviceRate = rate || user.serviceRate;
  user.serviceDescription = description || user.serviceDescription;

  await user.save();

  res.status(200).json({ success: true, message: "Service profile updated", data: { service, rate, description } });
});

export const updateServiceStatus = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  const { isOnline } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.isOnline = isOnline;
  await user.save();

  res.status(200).json({ success: true, message: `Status updated to ${isOnline ? 'Online' : 'Offline'}` });
});

export const getMatchingRequests = catchAsyncError(async (req, res, next) => {
  if (!req.user) return next(new ErrorHandler("Unauthorized", 401));

  const provider = await User.findById(req.user._id);
  if (!provider || provider.role !== "Service Provider") return next(new ErrorHandler("Not a provider", 403));
  if (!provider.verified) return next(new ErrorHandler("Provider not verified", 403));

  const providerRate = provider.serviceRate || 0;
  const providerService = provider.service || '';

  const tolerance = providerRate * 0.2;
  const minBudget = providerRate - tolerance;
  const maxBudget = providerRate + tolerance;

  const requests = await ServiceRequest.find({
    status: "Open",
    budget: { $gte: minBudget, $lte: maxBudget },
    typeOfWork: new RegExp(providerService, 'i') // Case insensitive match
  })
  .populate({
    path: 'requester',
    select: 'firstName lastName username email phone',
    model: 'User'
  })
  .sort({ createdAt: -1 })
  .limit(10); 

  res.status(200).json({
    success: true,
    requests,
    debug: {
      providerRate,
      providerService,
      minBudget,
      maxBudget,
      totalRequests: requests.length
    }
  });
});
