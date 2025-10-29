import express from "express";
import { isUserAuthenticated } from "../middlewares/auth.js";
import ServiceRequest from '../models/serviceRequest.js';
import Review from '../models/review.js';

import {
  getBookings,
  updateBookingStatus,
  leaveReview,
  getServiceRequests,
  postServiceRequest,
  getServiceProfile,
  updateServiceProfile,
  updateServiceStatus,
  getUserServiceRequests,
  cancelServiceRequest,
  acceptServiceRequest,
  getMatchingRequests,
  getUserServices,
  updateServiceRequest,
  getChatHistory,
  sendMessage,
  getChatList,
  markMessagesAsSeen
} from '../controllers/userFlowController.js';

const router = express.Router();

// Dashboard routes
router.get('/dashboard/stats', isUserAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total service requests for this provider
    const totalRequests = await ServiceRequest.countDocuments({
      serviceProvider: userId
    });

    const completedJobs = await ServiceRequest.countDocuments({
      serviceProvider: userId,
      status: 'Complete'
    });

    const activeJobs = await ServiceRequest.countDocuments({
      serviceProvider: userId,
      status: 'Working'
    });

    const cancelledJobs = await ServiceRequest.countDocuments({
      serviceProvider: userId,
      status: 'Cancelled'
    });

    // Get pending requests count (open requests where provider can still bid)
    const pendingRequests = await ServiceRequest.countDocuments({
      serviceProvider: userId,
      status: 'Available'
    });

    // Calculate average rating from reviews
    const reviews = await Review.find({ reviewee: userId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Calculate total earnings from completed jobs
    const completedJobsWithBudget = await ServiceRequest.find({
      serviceProvider: userId,
      status: 'Complete'
    }).select('budget');

    const totalEarnings = completedJobsWithBudget.reduce((sum, job) => sum + (job.budget || 0), 0);

    // Get profile views (this would need to be implemented based on your tracking system)
    // For now, we'll use a placeholder or calculate from other metrics
    const profileViews = Math.floor(totalRequests * 2.5) + Math.floor(completedJobs * 1.8);

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        completedJobs,
        activeJobs,
        cancelledJobs,
        pendingRequests,
        averageRating: Math.round(averageRating * 10) / 10,
        totalEarnings,
        profileViews
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

router.get('/dashboard/recent-activity', isUserAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent service requests for this user
    const recentRequests = await ServiceRequest.find({
      serviceProvider: userId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('requester', 'firstName lastName')
    .select('title category status budget createdAt');

    // Get recent reviews
    const recentReviews = await Review.find({
      reviewee: userId
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('reviewer', 'firstName lastName')
    .select('rating comments createdAt');

    const activities = [];

    // Format service requests as activities
    recentRequests.forEach((request, index) => {
      const customerName = request.requester ? `${request.requester.firstName} ${request.requester.lastName}` : 'Unknown';
      activities.push({
        id: `request_${request._id}`,
        type: request.status === 'Complete' ? 'job_completed' : 'new_request',
        title: `${request.title} - ${request.status}`,
        description: `Budget: $${request.budget} - Customer: ${customerName}`,
        time: getTimeAgo(request.createdAt),
        status: request.status === 'Complete' ? 'success' : 'pending'
      });
    });

    // Format reviews as activities
    recentReviews.forEach((review, index) => {
      const reviewerName = review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastName}` : 'Anonymous';
      activities.push({
        id: `review_${review._id}`,
        type: 'rating_received',
        title: 'Rating received',
        description: `${review.rating}-star rating from ${reviewerName} - "${review.comments?.substring(0, 50) || 'No comment'}"`,
        time: getTimeAgo(review.createdAt),
        status: 'success'
      });
    });

    // Sort activities by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 5) // Return only the 5 most recent
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

// Booking routes
router.get('/bookings', isUserAuthenticated, getBookings);
router.put('/booking/:id/status', isUserAuthenticated, updateBookingStatus);
router.post('/review', isUserAuthenticated, leaveReview);

// Service Request routes
router.get('/service-requests', isUserAuthenticated, getServiceRequests);
router.post('/post-service-request', isUserAuthenticated, postServiceRequest);
router.get('/user-service-requests', isUserAuthenticated, getUserServiceRequests);
router.delete('/service-request/:id/cancel', isUserAuthenticated, cancelServiceRequest);
router.put('/service-request/:id/update', isUserAuthenticated, updateServiceRequest);
router.post('/service-request/:id/accept', isUserAuthenticated, acceptServiceRequest);

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

// Service Profile routes
router.get('/service-profile', isUserAuthenticated, getServiceProfile);
router.post('/service-profile', isUserAuthenticated, updateServiceProfile);
router.put('/service-status', isUserAuthenticated, updateServiceStatus);

// Matching requests route
router.get('/matching-requests', isUserAuthenticated, getMatchingRequests);

// User services route
router.get('/services', isUserAuthenticated, getUserServices);

// Chat routes
router.get('/chat-history', isUserAuthenticated, getChatHistory);
router.get('/chat-list', isUserAuthenticated, getChatList);
router.post('/send-message', isUserAuthenticated, sendMessage);
router.put('/chat/:appointmentId/mark-seen', isUserAuthenticated, markMessagesAsSeen);

export default router;
