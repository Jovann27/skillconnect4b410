import User from "../models/userSchema.js";
import ServiceRequest from "../models/serviceRequest.js";

// Maximum limit for reports to prevent performance issues
const MAX_REPORT_LIMIT = 10000;

export const totalsReport = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const serviceProviders = await User.countDocuments({ role: "Service Provider" });
    const totalPopulation = 200; // example static

    res.json({ totalUsers, serviceProviders, totalPopulation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const demographicsReport = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 1000, MAX_REPORT_LIMIT);
    const users = await User.find().limit(limit);

    const ageGroups = { "18-25": 0, "26-35": 0, "36-50": 0, "50+": 0 };
    let worker = 0;
    let nonWorker = 0;

    users.forEach(user => {
      const age = Math.floor((Date.now() - new Date(user.birthdate)) / (1000 * 60 * 60 * 24 * 365.25));
      if (age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 50) ageGroups["36-50"]++;
      else ageGroups["50+"]++;

      if (user.employed === "Yes") worker++;
      else nonWorker++;
    });

    res.json({ ageGroups, employment: { worker, nonWorker }, limitedTo: limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const skillsReport = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 1000, MAX_REPORT_LIMIT);
    const users = await User.find().limit(limit);
    const skillsCount = {};

    users.forEach(user => {
      (user.skills || []).forEach(skill => {
        skillsCount[skill] = (skillsCount[skill] || 0) + 1;
      });
    });

    // Return just the skillsCount object to match frontend expectations
    res.json(skillsCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Skilled users per trade category (count users grouped by role or skill category)
export const skilledPerTrade = async (req, res) => {
  try {
    // We'll return counts per distinct skill and per role
    // For Service Providers, only count verified ones to match dashboard stats
    const users = await User.find().select('role skills verified');
    const byRole = {};
    const bySkill = {};

    users.forEach(u => {
      // Only count verified service providers
      if (u.role === 'Service Provider' && !u.verified) {
        return; // skip unverified service providers
      }
      
      byRole[u.role] = (byRole[u.role] || 0) + 1;
      (u.skills || []).forEach(skill => {
        bySkill[skill] = (bySkill[skill] || 0) + 1;
      });
    });

    res.json({ byRole, bySkill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Most booked services: aggregate ServiceRequest.serviceType counts
export const mostBookedServices = async (req, res) => {
  try {
    const agg = await ServiceRequest.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // normalize to an object
    const result = {};
    agg.forEach(a => { result[a._id || 'Unknown'] = a.count; });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Totals over time: user registrations per month (last N months)
export const totalsOverTime = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // aggregate users by year-month
    const agg = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $project: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } } },
      { $group: { _id: { year: "$year", month: "$month" }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // build a map for quick lookup
    const map = {};
    agg.forEach(a => {
      const key = `${a._id.year}-${String(a._id.month).padStart(2, '0')}`;
      map[key] = a.count;
    });

    // produce labels and values for the last N months
    const labels = [];
    const values = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(`${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`);
      values.push(map[key] || 0);
    }

    res.json({ labels, values });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
