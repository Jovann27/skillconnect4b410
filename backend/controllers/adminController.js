import JobFair from "../models/jobFairSchema.js";
import User from "../models/userSchema.js";
import ServiceRequest from "../models/serviceRequest.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";

// Create Job Fair
export const createJobFair = async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;

    const jobfair = await JobFair.create({
      title,
      description,
      date,
      time,
      location,
    });

    res.status(201).json({ success: true, jobfair });
  } catch (err) {
    console.error("createJobFair error", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all service requests
export const adminGetAllServiceRequests = async (req, res) => {
  try {
    const { skill, status, sort } = req.query;

    let filter = {};
    if (skill) {
      const regex = new RegExp(skill, 'i');

      // find users who have a matching skill via regex
      const usersWithSkill = await User.find({ skills: { $regex: regex } }).select("_id");
      const userIds = usersWithSkill.map(u => u._id);

      const orClauses = [{ title: regex }, { description: regex }];
      if (userIds.length) orClauses.push({ requester: { $in: userIds } });

      filter = { $or: orClauses };
    }

    if (status) {
      // normalize to capitalized enum
      const normalized = status[0].toUpperCase() + status.slice(1).toLowerCase();
      filter.status = normalized;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const requests = await ServiceRequest.find(filter)
      .populate('requester', 'firstName lastName profilePic')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalRequests = await ServiceRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalRequests / limit);

    res.json({
      count: totalRequests,
      totalPages,
      requests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify user
export const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.verified) return res.status(400).json({ success: false, message: "User is already verified" });

    user.verified = true;
    await user.save();

    res.json({ success: true, message: "User verified successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get verified service providers
export const getServiceProviders = async (req, res) => {
  try {
    const workers = await User.find({ role: "Service Provider", verified: true })
      .select("firstName lastName skills availability profilePic createdAt");
    res.json({ success: true, count: workers.length, workers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

//Ban User
export const banUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 404));
  if (user.role === "Admin") return next(new ErrorHandler("Cannot ban another admin", 403));

  user.verified = false;
  user.availability = "Not Available";
  user.banned = true; // add this field to your schema if it doesn’t exist
  await user.save();

  res.status(200).json({
    success: true,
    message: `User (${user.firstName} ${user.lastName}) has been banned.`,
  });
});

// Get dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: "Service Provider" });
    const verifiedProviders = await User.countDocuments({ role: "Service Provider", verified: true });
    const activeBookings = await Booking.countDocuments({ status: { $in: ["Pending", "Confirmed", "InProgress"] } });
    const totalBookings = await Booking.countDocuments();

    // Bookings per week (last 4 weeks)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 28);
    const bookingsOverTime = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      { $limit: 4 },
    ]);

    // Most booked categories (assuming from service requests)
    const mostBooked = await ServiceRequest.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalProviders,
        verifiedProviders,
        activeBookings,
        totalBookings,
        bookingsOverTime,
        mostBooked,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
