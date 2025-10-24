import User from "../models/userSchema.js";
import JobFair from "../models/jobFairSchema.js";
import ServiceRequest from "../models/serviceRequest.js"; 

export const getSkilledUsers = async (req, res) => {
  try {
    const workers = await User.find({ role: "Service Provider", verified: true })
      .select("firstName lastName skills availability profilePic createdAt");
    res.json({ success: true, count: workers.length, workers });
  } catch (err) {
    console.error("❌ Error fetching skilled users:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getJobFair = async (req, res) => {
  try {
    const jobfair = await JobFair.findOne().sort({ createdAt: -1 });
    if (!jobfair)
      return res.status(404).json({ success: false, message: "No job fair found" });
    res.json({ success: true, jobfair });
  } catch (err) {
    console.error("❌ Error fetching job fair:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const { skill, status, sort, includeAssigned } = req.query;
    let filter = {};

    if (skill) {
      const regex = new RegExp(skill, "i");
      const usersWithSkill = await User.find({ skills: { $regex: regex } }).select("_id");
      const userIds = usersWithSkill.map(u => u._id);

      const orClauses = [
        { serviceType: regex },
        { description: regex },
        { user: { $in: userIds } }
      ];
      filter = { $or: orClauses };
    }

    if (status) {
      filter.status = status.toLowerCase();
    }

    // By default, only return unassigned requests so accepted ones are hidden from other providers
    const unassignedFilter = { $or: [{ serviceProvider: { $exists: false } }, { serviceProvider: null }] };
    if (includeAssigned !== "true") {
      filter = Object.keys(filter).length ? { $and: [unassignedFilter, filter] } : unassignedFilter;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    let sortObj = { createdAt: -1 };
    if (sort) {
      const [f, order] = sort.split(":");
      sortObj = { [f]: order === "asc" ? 1 : -1 };
    }

    const total = await ServiceRequest.countDocuments(filter);

    const requests = await ServiceRequest.find(filter)
      .select("budget serviceType date time status noteToWorker user serviceProvider")
      .populate("user", "firstName lastName email role")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Add fullName field for each request
    const requestsWithFullName = requests.map(req => {
      const fullName = req.user ? `${req.user.firstName} ${req.user.lastName}` : "N/A";
      return {
        ...req.toObject(),
        fullName
      };
    });

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: requests.length,
      requests: requestsWithFullName,
    });
  } catch (err) {
    console.error("❌ Error fetching service requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id);

    if (!request)
      return res.status(404).json({ success: false, message: "Service request not found" });

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in first." });
    }

    // If already assigned to a provider, prevent re-accepting
    if (request.serviceProvider)
      return res.status(400).json({ success: false, message: "Request already accepted" });

    // Assign current user as the service provider and mark as Working (confirmed)
    request.serviceProvider = req.user._id;
    request.acceptedBy = req.user._id; // backward compatibility
    request.status = "Working";

    await request.save();

    res.json({ success: true, message: "Service request accepted", request });
  } catch (err) {
    console.error("❌ Error updating service request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const postServiceRequest = async (req, res) => {
  try {
    const { serviceType, description, date, time, trackingId, serviceProvider } = req.body;
    if (!serviceType || !description || !date || !time || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      if(Array.isArray(user.role)) {
        if (!user.role.includes("Requestor")) {
          user.role.push("Requestor");
          await user.save();
        } else {
          if (user.role !== "Service Requester") {
            user.role = [user.role, "Service Requester"];
            await user.save();
          }
        }
      }
    }

    let assignedProviderId = null;
    if (serviceProvider) {
      const provider = await User.findById(serviceProvider);
      if (!provider || provider.role !== "Service Provider") {
        return res.status(400).json({ success: false, message: "Invalid service provider" });
      }
      assignedProviderId = provider._id;
      
    }

    const newRequest = new ServiceRequest({
      user: req.user._id,
      serviceType,
      description,
      date,
      time,
      trackingId,
      ...(assignedProviderId ? { serviceProvider: assignedProviderId } : {}),
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      request: newRequest,
      updatedRole: user.role,
    });
  } catch (err) {
    console.error("❌ Error creating service request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyAcceptedRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ServiceRequest.find({ 
      $or: [ { serviceProvider: userId }, { acceptedBy: userId } ]
    })
    .populate("user", "firstName lastName email")
    .populate("serviceProvider", "firstName lastName email")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("Error fetching accepted requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyIncomingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await ServiceRequest.find({ serviceProvider: userId, status: "Waiting" })
      .populate("user", "firstName lastName email")
      .populate("serviceProvider", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching incoming requests:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const ignoreServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id);

    if (!request) return res.status(404).json({ success: false, message: "Service request not found" });
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Only assigned provider can reject
    if (!request.serviceProvider || String(request.serviceProvider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assigned provider can reject this request" });
    }

    request.status = "Cancelled"; // strict reject; user can rebook or choose another provider
    await request.save();

    res.json({ success: true, message: "Service request rejected", request });
  } catch (err) {
    console.error("❌ Error rejecting service request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const completeServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id);

    if (!request) return res.status(404).json({ success: false, message: "Service request not found" });
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Only assigned provider can complete
    if (!request.serviceProvider || String(request.serviceProvider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the assigned provider can complete this request" });
    }

    if (request.status !== "Working") {
      return res.status(400).json({ success: false, message: "Only working requests can be completed" });
    }

    request.status = "Completed";
    await request.save();

    res.json({ success: true, message: "Service request marked as completed", request });
  } catch (err) {
    console.error("❌ Error completing service request:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({ success: true, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to get settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};